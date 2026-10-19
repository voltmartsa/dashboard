import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { TenderSource } from "@/types";

// The normalized shape every source scraper produces — matches the columns the
// batch upsert in src/lib/tenders/run.ts writes. `documents` is either a list
// of downloadable files or Prisma.JsonNull (never a bare null), same convention
// as mapTenderForUpsert.
export type NormalizedTender = {
  source: TenderSource;
  externalId: string;
  title: string;
  category: string | null;
  province: string | null;
  department: string | null;
  tenderType: string | null;
  publishedDate: Date | null;
  closingDate: Date | null;
  briefingDate: Date | null;
  briefingVenue: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  documents: { fileName: string; url: string }[] | typeof Prisma.JsonNull;
  sourceUrl: string | null;
};

// Government-site WAFs treat AWS datacenter IPs (where Vercel functions run)
// differently from browser traffic — a realistic browser UA/Accept-Language
// avoids that class of block. Same trick as the eTenders scraper.
export const BROWSER_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
  "Accept-Language": "en-ZA,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

// Per-request cap so one hung request can't eat the whole cron function budget.
export const REQUEST_TIMEOUT_MS = 20_000;

// Bounded-concurrency map — some portals rate-limit bursts of parallel
// requests from a single IP, so we trickle them a few at a time.
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export async function fetchText(url: string, extraHeaders?: Record<string, string>): Promise<string> {
  const res = await fetch(url, {
    headers: { ...BROWSER_HEADERS, ...extraHeaders },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  }
  return res.text();
}

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

// SAST is UTC+2 with no DST — government portals print wall-clock local time.
const SAST_OFFSET_HOURS = 2;

// Parses the "25 September, 2026 11:00 AM" style strings the Gauteng portal
// renders (time optional; trailing words like "Compulsory" are ignored).
export function parseSaDateTime(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const m = raw.match(
    /(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})(?:[\s,]+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i,
  );
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  const day = Number(m[1]);
  const year = Number(m[3]);
  let hour = m[4] ? Number(m[4]) : 0;
  const minute = m[5] ? Number(m[5]) : 0;
  const meridiem = m[6]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  const ts = Date.UTC(year, month, day, hour - SAST_OFFSET_HOURS, minute);
  return Number.isNaN(ts) ? null : new Date(ts);
}

// WordPress `created_time` values look like "2026-09-08 09:05:33" (SAST).
export function parseSqlDateTime(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const m = raw.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const ts = Date.UTC(
    Number(m[1]), Number(m[2]) - 1, Number(m[3]),
    Number(m[4]) - SAST_OFFSET_HOURS, Number(m[5]), m[6] ? Number(m[6]) : 0,
  );
  return Number.isNaN(ts) ? null : new Date(ts);
}

// Best-effort closing-date extraction from a free-text title/description —
// used by sources that don't expose the closing date as a structured field.
// Recognises "closing date: 15 May 2026", "CD: 2026-05-15", "15/05/2026".
export function findClosingDateInText(text: string): Date | null {
  const cleaned = text.replace(/\s+/g, " ");
  const labelled = cleaned.match(
    /clos(?:ing|e)[^0-9]{0,20}(\d{1,2}\s+[A-Za-z]+,?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  );
  const candidate = labelled?.[1];
  if (!candidate) return null;

  const named = parseSaDateTime(candidate);
  if (named) return named;

  const iso = candidate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3], 12 - SAST_OFFSET_HOURS));

  const dmy = candidate.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    return new Date(Date.UTC(year, Number(dmy[2]) - 1, Number(dmy[1]), 12 - SAST_OFFSET_HOURS));
  }
  return null;
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
  "&#039;": "'", "&apos;": "'", "&nbsp;": " ",
};

// Enough HTML-entity decoding for government-portal table cells. Runs twice so
// double-escaped sequences ("&amp;nbsp;") collapse fully.
export function decodeEntities(input: string): string {
  const pass = (s: string) =>
    s
      .replace(/&(amp|lt|gt|quot|apos|nbsp|#0?39);/g, (m) => ENTITIES[m] ?? m)
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  return pass(pass(input));
}

// \s in JS regex also matches U+00A0, so decoded non-breaking spaces collapse
// here too.
export function stripTags(html: string): string {
  return decodeEntities(
    html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}
