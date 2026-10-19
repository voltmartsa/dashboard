import "server-only";
import { randomUUID } from "crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchAdvertisedTenders, mapTenderForUpsert } from "@/lib/tenders/scrape";
import { fetchGautengHealthTenders } from "@/lib/tenders/sources/gauteng-health";
import { fetchVhembeTenders } from "@/lib/tenders/sources/vhembe";
import type { NormalizedTender } from "@/lib/tenders/sources/shared";
import { tenderMatchesRule } from "@/lib/tenders/match";
import { sendPushToUser } from "@/lib/notifications/push";

type SourceStatus = "ok" | { error: string };

// Run one source in isolation — a portal being down or blocking us must not
// take the others down with it. Returns [] on failure and the reason as status.
async function runSource(
  label: string,
  fn: () => Promise<NormalizedTender[]>,
): Promise<{ rows: NormalizedTender[]; status: SourceStatus }> {
  try {
    return { rows: await fn(), status: "ok" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[tenders] source "${label}" failed:`, message);
    return { rows: [], status: { error: message } };
  }
}

// ~2000 currently-advertised tenders on eTenders — one upsert per row would be
// thousands of round trips to the DB (too slow for the cron function's time
// budget), so rows are batched into multi-row INSERT ... ON CONFLICT statements.
const UPSERT_CHUNK_SIZE = 200;

// Run a batch of chunk-processing promises with bounded concurrency, so
// e.g. 10 DB round trips happen a few at a time instead of one huge
// Promise.all (which can exhaust the DB connection pool) or a slow
// fully-sequential loop.
async function mapWithConcurrency<T, R>(
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

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function upsertTendersBatch(rows: ReturnType<typeof mapTenderForUpsert>[]) {
  const chunks = chunk(rows, UPSERT_CHUNK_SIZE);

  const results = await mapWithConcurrency(chunks, 4, async (batch) => {
    const valueRows = batch.map(
      (r) => Prisma.sql`(
        ${randomUUID()}, ${r.source}, ${r.externalId}, ${r.title}, ${r.category}, ${r.province},
        ${r.department}, ${r.tenderType}, ${r.publishedDate}, ${r.closingDate}, ${r.briefingDate},
        ${r.briefingVenue}, ${r.contactPerson}, ${r.contactEmail}, ${r.contactPhone},
        ${r.documents === Prisma.JsonNull ? Prisma.DbNull : JSON.stringify(r.documents)}::jsonb,
        ${r.sourceUrl}, now(), now()
      )`,
    );

    return prisma.$queryRaw<{ id: string; externalId: string; isNew: boolean }[]>`
      INSERT INTO "Tender" (
        id, source, "externalId", title, category, province,
        department, "tenderType", "publishedDate", "closingDate", "briefingDate",
        "briefingVenue", "contactPerson", "contactEmail", "contactPhone", documents,
        "sourceUrl", "createdAt", "updatedAt"
      )
      VALUES ${Prisma.join(valueRows)}
      ON CONFLICT (source, "externalId") DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        province = EXCLUDED.province,
        department = EXCLUDED.department,
        "tenderType" = EXCLUDED."tenderType",
        "publishedDate" = EXCLUDED."publishedDate",
        "closingDate" = EXCLUDED."closingDate",
        "briefingDate" = EXCLUDED."briefingDate",
        "briefingVenue" = EXCLUDED."briefingVenue",
        "contactPerson" = EXCLUDED."contactPerson",
        "contactEmail" = EXCLUDED."contactEmail",
        "contactPhone" = EXCLUDED."contactPhone",
        documents = EXCLUDED.documents,
        "sourceUrl" = EXCLUDED."sourceUrl",
        "updatedAt" = now()
      RETURNING id, "externalId", (xmax = 0) AS "isNew"
    `;
  });

  const newTenders: { id: string; externalId: string }[] = [];
  for (const result of results) {
    for (const row of result) {
      if (row.isNew) newTenders.push({ id: row.id, externalId: row.externalId });
    }
  }
  return newTenders;
}

export async function scrapeAndMatchTenders() {
  const [etenders, gautengHealth, vhembe] = await Promise.all([
    runSource("etenders", async () => (await fetchAdvertisedTenders()).map(mapTenderForUpsert)),
    runSource("gautengHealth", fetchGautengHealthTenders),
    runSource("vhembe", fetchVhembeTenders),
  ]);

  const sources = {
    etenders: etenders.status,
    gautengHealth: gautengHealth.status,
    vhembe: vhembe.status,
  };

  if (Object.values(sources).every((s) => s !== "ok")) {
    throw new Error(`All tender sources failed: ${JSON.stringify(sources)}`);
  }

  const rows = [...etenders.rows, ...gautengHealth.rows, ...vhembe.rows].filter(
    (r) => r.externalId,
  );
  const newTenders = await upsertTendersBatch(rows);

  let matchesCreated = 0;
  const notifiedOwners = new Set<string>();

  if (newTenders.length > 0) {
    const [rules, tenders] = await Promise.all([
      prisma.tenderRule.findMany({ where: { active: true } }),
      prisma.tender.findMany({ where: { id: { in: newTenders.map((t) => t.id) } } }),
    ]);

    // These tenders were just inserted as brand-new rows, so no TenderMatch
    // can already reference them — a plain batch insert (no per-pair upsert
    // round trip) is safe and avoids an O(tenders * rules) sequential loop,
    // which is what made the first production run (empty Tender table, so
    // every scraped tender counted as "new") blow past the function's time budget.
    const pairs: { tenderId: string; ruleId: string; ownerId: string | null }[] = [];
    for (const tender of tenders) {
      for (const rule of rules) {
        if (tenderMatchesRule(tender, rule)) {
          pairs.push({ tenderId: tender.id, ruleId: rule.id, ownerId: rule.ownerId });
        }
      }
    }
    matchesCreated = pairs.length;

    const ownerNewMatches = new Map<string, number>();
    for (const pair of pairs) {
      if (pair.ownerId) {
        ownerNewMatches.set(pair.ownerId, (ownerNewMatches.get(pair.ownerId) ?? 0) + 1);
      }
    }

    if (pairs.length > 0) {
      await mapWithConcurrency(chunk(pairs, UPSERT_CHUNK_SIZE), 4, async (batch) => {
        const valueRows = batch.map(
          (p) => Prisma.sql`(${randomUUID()}, ${p.tenderId}, ${p.ruleId}, ${p.ownerId}, now())`,
        );
        await prisma.$executeRaw`
          INSERT INTO "TenderMatch" (id, "tenderId", "ruleId", "ownerId", "createdAt")
          VALUES ${Prisma.join(valueRows)}
          ON CONFLICT ("tenderId", "ruleId") DO NOTHING
        `;
      });
    }

    for (const [ownerId, count] of ownerNewMatches) {
      try {
        await sendPushToUser(ownerId, {
          title: "New tenders match your rules",
          body: `${count} new tender${count === 1 ? "" : "s"} matched your saved rules.`,
        });
        notifiedOwners.add(ownerId);
      } catch {
        // Push is best-effort — the tender still shows up in the Tenders tab regardless.
      }
    }

    if (notifiedOwners.size > 0) {
      await prisma.tenderMatch.updateMany({
        where: {
          tenderId: { in: tenders.map((t) => t.id) },
          ownerId: { in: [...notifiedOwners] },
          notifiedAt: null,
        },
        data: { notifiedAt: new Date() },
      });
    }
  }

  return {
    scraped: rows.length,
    newTenders: newTenders.length,
    matchesCreated,
    notifiedOwners: notifiedOwners.size,
    sources,
  };
}
