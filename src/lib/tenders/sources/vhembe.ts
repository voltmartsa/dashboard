import "server-only";
import {
  BROWSER_HEADERS,
  REQUEST_TIMEOUT_MS,
  findClosingDateInText,
  mapWithConcurrency,
  parseSqlDateTime,
  type NormalizedTender,
} from "@/lib/tenders/sources/shared";

// Vhembe District Municipality runs WordPress with the "wp-file-download"
// plugin. The advertised-tenders / RFQ pages are just a client-side file tree
// that pulls JSON from admin-ajax.php:
//   ?action=wpfd&task=categories.display&id=<catId>  -> { categories: [...] }
//   ?action=wpfd&task=files.display&id=<catId>        -> { files: [...] }
// Files are grouped into month sub-categories under a per-page root category.
const AJAX_URL = "https://vhembe.gov.za/wp-admin/admin-ajax.php";

const ROOTS = [
  {
    rootId: 111,
    tenderType: "Tender",
    sourceUrl: "https://vhembe.gov.za/advertised-tenders-2/",
  },
  {
    rootId: 128,
    tenderType: "RFQ",
    sourceUrl: "https://vhembe.gov.za/request-for-quotation/",
  },
] as const;

// Only keep files published/updated within this window — the portal keeps
// years of archived months we don't want flooding the dashboard on first run.
const FRESH_DAYS = 150;
const MAX_CATEGORIES = 20; // safety cap on how many month-categories we query
const FETCH_CONCURRENCY = 3; // trickle requests — the portal rate-limits bursts

type WpfdCategory = { term_id: number; name?: string; count?: number };
type WpfdFile = {
  ID: number;
  post_title?: string;
  ext?: string;
  description?: string;
  created_time?: string;
  modified_time?: string;
  catid?: string | number;
  catname?: string;
  linkdownload?: string;
};

async function wpfd<T>(task: string, id: number, sourceUrl: string): Promise<T> {
  const url = `${AJAX_URL}?juwpfisadmin=false&action=wpfd&task=${task}&id=${id}`;
  const res = await fetch(url, {
    headers: { ...BROWSER_HEADERS, "X-Requested-With": "XMLHttpRequest", Referer: sourceUrl },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`wpfd ${task}#${id} -> ${res.status} ${res.statusText}`);
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`wpfd ${task}#${id} returned non-JSON: ${text.slice(0, 120)}`);
  }
}

// Tenders are grouped one level below the root, into month categories
// ("September 2026", "August 2026", …). We only need the root plus its direct
// children that actually hold files — recursing the whole tree pulls in years
// of archives and dozens of needless requests. FRESH_DAYS drops stale months
// at map time; this keeps the request count near ~10.
async function collectCategoryIds(rootId: number, sourceUrl: string): Promise<number[]> {
  const data = await wpfd<{ categories?: WpfdCategory[] }>(
    "categories.display",
    rootId,
    sourceUrl,
  );
  const children = data.categories ?? [];
  const withFiles = children.filter((c) => (c.count ?? 0) > 0);
  // If the portal ever stops reporting counts, fall back to all children.
  const picked = (withFiles.length > 0 ? withFiles : children)
    .map((c) => c.term_id)
    .slice(0, MAX_CATEGORIES);
  return [rootId, ...picked];
}

function toNormalized(
  file: WpfdFile,
  root: (typeof ROOTS)[number],
): NormalizedTender | null {
  const title = (file.post_title ?? "").trim();
  if (!file.ID || !title) return null;

  const published = parseSqlDateTime(file.created_time);
  const modified = parseSqlDateTime(file.modified_time);
  const freshEnough = [published, modified].some(
    (d) => d && Date.now() - d.getTime() <= FRESH_DAYS * 24 * 60 * 60 * 1000,
  );
  if (!freshEnough) return null;

  const ext = (file.ext || "pdf").replace(/^\./, "");
  const url =
    file.linkdownload ||
    `${AJAX_URL}?juwpfisadmin=false&action=wpfd&task=file.download&wpfd_category_id=${file.catid}&wpfd_file_id=${file.ID}`;

  return {
    source: "VHEMBE",
    externalId: String(file.ID),
    title,
    category: null,
    province: "Limpopo",
    department: "Vhembe District Municipality",
    tenderType: root.tenderType,
    publishedDate: published,
    closingDate: findClosingDateInText(`${title} ${file.description ?? ""}`),
    briefingDate: null,
    briefingVenue: null,
    contactPerson: null,
    contactEmail: null,
    contactPhone: null,
    documents: [{ fileName: `${title}.${ext}`, url }],
    sourceUrl: root.sourceUrl,
  };
}

export async function fetchVhembeTenders(): Promise<NormalizedTender[]> {
  const byId = new Map<string, NormalizedTender>();
  let anySucceeded = false;

  for (const root of ROOTS) {
    let categoryIds: number[];
    try {
      categoryIds = await collectCategoryIds(root.rootId, root.sourceUrl);
    } catch (err) {
      console.error(`[tenders/vhembe] category listing for root #${root.rootId} failed:`, err);
      continue;
    }

    const fileLists = await mapWithConcurrency(categoryIds, FETCH_CONCURRENCY, async (id) => {
      try {
        const data = await wpfd<{ files?: WpfdFile[] }>("files.display", id, root.sourceUrl);
        anySucceeded = true;
        return data.files ?? [];
      } catch (err) {
        console.error(`[tenders/vhembe] files.display#${id} failed:`, err);
        return [] as WpfdFile[];
      }
    });

    for (const file of fileLists.flat()) {
      const normalized = toNormalized(file, root);
      if (normalized && !byId.has(normalized.externalId)) {
        byId.set(normalized.externalId, normalized);
      }
    }
  }

  if (!anySucceeded) {
    throw new Error("Vhembe wp-file-download API was unreachable");
  }

  return [...byId.values()];
}
