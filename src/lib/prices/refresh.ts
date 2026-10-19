import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchPrice } from "@/lib/prices/fetch";
import { priceDay } from "@/lib/prices/stores";

const CONCURRENCY = 4;

// Re-checks the matching links, least recently checked first, and stops
// starting new checks once the time budget is used up so the function never
// hits its maxDuration — anything skipped is first in line on the next run.
export async function refreshPriceLinks(where: Prisma.PriceLinkWhereInput, budgetMs = 45_000) {
  const deadline = Date.now() + budgetMs;
  const links = await prisma.priceLink.findMany({
    where,
    select: { id: true, url: true },
    orderBy: [{ checkedAt: { sort: "asc", nulls: "first" } }],
  });

  let checked = 0;
  let failed = 0;
  let next = 0;
  const day = priceDay();

  async function worker() {
    while (next < links.length && Date.now() < deadline) {
      const link = links[next++];
      const checkedAt = new Date();
      try {
        const r = await fetchPrice(link.url);
        await prisma.priceLink.update({
          where: { id: link.id },
          data: { price: r.price, regularPrice: r.regularPrice, title: r.title, inStock: r.inStock, error: null, checkedAt },
        });
        await prisma.pricePoint.upsert({
          where: { linkId_day: { linkId: link.id, day } },
          create: { linkId: link.id, day, price: r.price },
          update: { price: r.price },
        });
      } catch (err) {
        failed++;
        await prisma.priceLink.update({
          where: { id: link.id },
          data: { error: err instanceof Error ? err.message : String(err), checkedAt },
        });
      }
      checked++;
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, links.length) }, worker));
  return { total: links.length, checked, failed, skipped: links.length - checked };
}
