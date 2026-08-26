import "server-only";
import { randomUUID } from "crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchAdvertisedTenders, mapTenderForUpsert } from "@/lib/tenders/scrape";
import { tenderMatchesRule } from "@/lib/tenders/match";
import { sendPushToUser } from "@/lib/notifications/push";

// ~2000 currently-advertised tenders on eTenders — one upsert per row would be
// thousands of round trips to the DB (too slow for the cron function's time
// budget), so rows are batched into multi-row INSERT ... ON CONFLICT statements.
const UPSERT_CHUNK_SIZE = 200;

async function upsertTendersBatch(rows: ReturnType<typeof mapTenderForUpsert>[]) {
  const newTenders: { id: string; externalId: string }[] = [];

  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    if (chunk.length === 0) continue;

    const valueRows = chunk.map(
      (r) => Prisma.sql`(
        ${randomUUID()}, ${r.externalId}, ${r.title}, ${r.category}, ${r.province},
        ${r.department}, ${r.tenderType}, ${r.publishedDate}, ${r.closingDate}, ${r.briefingDate},
        ${r.briefingVenue}, ${r.contactPerson}, ${r.contactEmail}, ${r.contactPhone},
        ${r.documents === Prisma.JsonNull ? Prisma.DbNull : JSON.stringify(r.documents)}::jsonb,
        ${r.sourceUrl}, now(), now()
      )`,
    );

    const result = await prisma.$queryRaw<{ id: string; externalId: string; isNew: boolean }[]>`
      INSERT INTO "Tender" (
        id, "externalId", title, category, province,
        department, "tenderType", "publishedDate", "closingDate", "briefingDate",
        "briefingVenue", "contactPerson", "contactEmail", "contactPhone", documents,
        "sourceUrl", "createdAt", "updatedAt"
      )
      VALUES ${Prisma.join(valueRows)}
      ON CONFLICT ("externalId") DO UPDATE SET
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

    for (const row of result) {
      if (row.isNew) newTenders.push({ id: row.id, externalId: row.externalId });
    }
  }

  return newTenders;
}

export async function scrapeAndMatchTenders() {
  const raw = await fetchAdvertisedTenders();
  const rows = raw.map(mapTenderForUpsert).filter((r) => r.externalId);
  const newTenders = await upsertTendersBatch(rows);

  let matchesCreated = 0;
  const notifiedOwners = new Set<string>();

  if (newTenders.length > 0) {
    const [rules, tenders] = await Promise.all([
      prisma.tenderRule.findMany({ where: { active: true } }),
      prisma.tender.findMany({ where: { id: { in: newTenders.map((t) => t.id) } } }),
    ]);

    const ownerNewMatches = new Map<string, number>();

    for (const tender of tenders) {
      for (const rule of rules) {
        if (!tenderMatchesRule(tender, rule)) continue;

        const match = await prisma.tenderMatch.upsert({
          where: { tenderId_ruleId: { tenderId: tender.id, ruleId: rule.id } },
          create: { tenderId: tender.id, ruleId: rule.id, ownerId: rule.ownerId },
          update: {},
        });
        if (match.notifiedAt) continue;

        matchesCreated++;
        if (rule.ownerId) {
          ownerNewMatches.set(rule.ownerId, (ownerNewMatches.get(rule.ownerId) ?? 0) + 1);
        }
      }
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
    scraped: raw.length,
    newTenders: newTenders.length,
    matchesCreated,
    notifiedOwners: notifiedOwners.size,
  };
}
