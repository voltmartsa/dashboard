import "server-only";
import type { Tender, TenderRule } from "@/generated/prisma/client";

export function tenderMatchesRule(tender: Tender, rule: TenderRule): boolean {
  if (rule.provinces.length > 0) {
    if (!tender.province || !rule.provinces.includes(tender.province)) return false;
  }

  if (rule.categories.length > 0) {
    if (!tender.category || !rule.categories.includes(tender.category)) return false;
  }

  if (rule.keywords.length > 0) {
    const haystack = `${tender.title} ${tender.category ?? ""}`.toLowerCase();
    if (!rule.keywords.some((kw) => haystack.includes(kw.toLowerCase()))) return false;
  }

  // A rule with no criteria at all would match everything — the form
  // requires at least one, but guard here too in case data comes in another way.
  return rule.keywords.length > 0 || rule.categories.length > 0 || rule.provinces.length > 0;
}

export function isTenderStillOpen(closingDate: Date | null): boolean {
  return !closingDate || closingDate.getTime() >= Date.now();
}
