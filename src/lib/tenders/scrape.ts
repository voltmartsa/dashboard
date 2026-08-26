import "server-only";
import { Prisma } from "@/generated/prisma/client";

// eTenders (National Treasury) exposes its "currently advertised" tender
// list through the DataTables endpoint the portal's own UI calls — no
// public API, but it's an unauthenticated GET returning JSON. status=1
// means "currently advertised" (as opposed to awarded/cancelled/closed).
const ETENDERS_LIST_URL = "https://www.etenders.gov.za/Home/PaginatedTenderOpportunities";
const PAGE_SIZE = 500;
const MAX_PAGES = 20; // safety cap — ~10k tenders, well above the portal's current volume

type EtendersDocument = {
  supportDocumentID: string;
  fileName: string;
  extension: string;
};

type EtendersTender = {
  id: number;
  tender_No: string;
  description: string;
  category: string | null;
  type: string | null;
  organ_of_State: string | null;
  department: string | null;
  province: string | null;
  date_Published: string | null;
  closing_Date: string | null;
  compulsory_briefing_session: string | null;
  briefingVenue: string | null;
  contactPerson: string | null;
  email: string | null;
  telephone: string | null;
  supportDocument: EtendersDocument[] | null;
};

type EtendersResponse = {
  recordsTotal: number;
  data: EtendersTender[];
};

function buildListUrl(start: number, length: number) {
  const params = new URLSearchParams();
  params.set("draw", "1");
  const columns: Array<[string, boolean, boolean]> = [
    ["", true, false],
    ["category", true, true],
    ["description", true, false],
    ["eSubmission", true, true],
    ["date_Published", true, true],
    ["closing_Date", true, true],
    ["actions", true, true],
  ];
  columns.forEach(([data, searchable, orderable], i) => {
    params.set(`columns[${i}][data]`, data);
    params.set(`columns[${i}][name]`, "");
    params.set(`columns[${i}][searchable]`, String(searchable));
    params.set(`columns[${i}][orderable]`, String(orderable));
    params.set(`columns[${i}][search][value]`, "");
    params.set(`columns[${i}][search][regex]`, "false");
  });
  params.set("order[0][column]", "2");
  params.set("order[0][dir]", "desc");
  params.set("start", String(start));
  params.set("length", String(length));
  params.set("search[value]", "");
  params.set("search[regex]", "false");
  params.set("status", "1");
  params.set("_", String(Date.now()));
  return `${ETENDERS_LIST_URL}?${params.toString()}`;
}

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDocuments(docs: EtendersDocument[] | null) {
  if (!docs || docs.length === 0) return Prisma.JsonNull;
  return docs.map((d) => ({
    fileName: d.fileName,
    url: `https://www.etenders.gov.za/home/Download/?blobName=${d.supportDocumentID}${d.extension}&downloadedFileName=${encodeURIComponent(d.fileName)}`,
  }));
}

export async function fetchAdvertisedTenders(): Promise<EtendersTender[]> {
  const all: EtendersTender[] = [];
  let start = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(buildListUrl(start, PAGE_SIZE), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`eTenders list request failed: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as EtendersResponse;
    all.push(...json.data);

    start += PAGE_SIZE;
    if (start >= json.recordsTotal || json.data.length === 0) break;
  }

  return all;
}

export function mapTenderForUpsert(t: EtendersTender) {
  return {
    externalId: t.tender_No.trim(),
    title: t.description,
    category: t.category,
    province: t.province,
    department: t.department ?? t.organ_of_State,
    tenderType: t.type,
    publishedDate: toDate(t.date_Published),
    closingDate: toDate(t.closing_Date),
    briefingDate: toDate(t.compulsory_briefing_session),
    briefingVenue: t.briefingVenue,
    contactPerson: t.contactPerson,
    contactEmail: t.email,
    contactPhone: t.telephone,
    documents: toDocuments(t.supportDocument),
    sourceUrl: `https://www.etenders.gov.za/home/tenderdetails?id=${t.id}`,
  };
}
