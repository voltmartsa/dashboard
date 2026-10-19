import "server-only";
import { Prisma } from "@/generated/prisma/client";
import {
  fetchText,
  parseSaDateTime,
  stripTags,
  type NormalizedTender,
} from "@/lib/tenders/sources/shared";

// The Gauteng provincial e-tenders portal renders advertised tenders as one
// server-side HTML table per page (no API). Two parallel listings exist —
// "Tender Opportunities" and "Open Tenders" — with the same table shape:
//   [ Tender Number | Department | Description | Briefing Session Date | Closing Date ]
// The number cell links via ASP.NET __doPostBack (no deep-linkable URL), but
// its postback payload carries the tender type, which we pull out.
const LIST_PAGES = [
  "https://e-tenders.gauteng.gov.za/pages/advertised-tenders.aspx",
  "https://e-tenders.gauteng.gov.za/Pages/Advertised-Open-Tenders.aspx",
];

const DEPARTMENT_LABEL = "Gauteng Department of Health";

type RawRow = {
  externalId: string;
  department: string;
  description: string;
  briefingRaw: string;
  closingRaw: string;
  tenderType: string | null;
  sourceUrl: string;
};

function parseListPage(html: string, sourceUrl: string): RawRow[] {
  const table = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!table) return [];

  const rows = table[1].match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const out: RawRow[] = [];

  for (const row of rows) {
    const cells = row.match(/<td[\s\S]*?<\/td>/gi);
    if (!cells || cells.length < 5) continue; // header row has <th>, skip

    const externalId = stripTags(cells[0]);
    if (!externalId || /tender\s*number/i.test(externalId)) continue;

    const typeMatch = cells[0].match(/Tender_x0020_Type=([^#}'"&]+)/i);

    out.push({
      externalId,
      department: stripTags(cells[1]),
      description: stripTags(cells[2]),
      briefingRaw: stripTags(cells[3]),
      closingRaw: stripTags(cells[4]),
      tenderType: typeMatch ? typeMatch[1].trim() : null,
      sourceUrl,
    });
  }
  return out;
}

function toNormalized(row: RawRow): NormalizedTender {
  return {
    source: "GAUTENG_HEALTH",
    externalId: row.externalId,
    title: row.description || row.externalId,
    category: null,
    province: "Gauteng",
    department: DEPARTMENT_LABEL,
    tenderType: row.tenderType,
    publishedDate: null, // portal doesn't expose a publish date in the listing
    closingDate: parseSaDateTime(row.closingRaw),
    briefingDate: parseSaDateTime(row.briefingRaw),
    briefingVenue: null,
    contactPerson: null,
    contactEmail: null,
    contactPhone: null,
    documents: Prisma.JsonNull, // documents live behind a __doPostBack detail view
    sourceUrl: row.sourceUrl,
  };
}

export async function fetchGautengHealthTenders(): Promise<NormalizedTender[]> {
  const pages = await Promise.all(
    LIST_PAGES.map(async (url) => {
      try {
        return parseListPage(await fetchText(url), url);
      } catch (err) {
        // One listing being down shouldn't sink the other.
        console.error(`[tenders/gauteng-health] ${url} failed:`, err);
        return [] as RawRow[];
      }
    }),
  );

  const byId = new Map<string, NormalizedTender>();
  for (const row of pages.flat()) {
    if (!/health/i.test(row.department)) continue;
    // Same tender can appear on both listings — first one wins.
    if (!byId.has(row.externalId)) byId.set(row.externalId, toNormalized(row));
  }

  if (pages.every((p) => p.length === 0)) {
    throw new Error("Gauteng e-tenders returned no rows from either listing page");
  }

  return [...byId.values()];
}
