import { Gavel, ListFilter } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TenderCard } from "@/components/tenders/tender-card";
import { TenderRuleFormDialog } from "@/components/tenders/tender-rule-form-dialog";
import { TenderRuleRow } from "@/components/tenders/tender-rule-row";
import { RunScrapeNowButton } from "@/components/tenders/run-scrape-now-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTenderStillOpen } from "@/lib/tenders/match";

// The manual "Scrape now" button invokes runTenderScrapeNow, a Server
// Action rendered from this page — it needs the same time budget as the
// cron route for the same reason (pagination fetch + batch DB writes).
export const maxDuration = 60;

export default async function TendersPage() {
  const user = await requireUser();

  const rules = await prisma.tenderRule.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { matches: true } } },
  });

  const matches = await prisma.tenderMatch.findMany({
    where: { ownerId: user.id },
    include: { tender: true, rule: { select: { label: true } } },
    orderBy: { tender: { closingDate: "asc" } },
  });

  const tenderMap = new Map<
    string,
    { tender: (typeof matches)[number]["tender"]; ruleLabels: string[] }
  >();
  for (const m of matches) {
    const entry = tenderMap.get(m.tender.id);
    if (entry) {
      entry.ruleLabels.push(m.rule.label);
    } else {
      tenderMap.set(m.tender.id, { tender: m.tender, ruleLabels: [m.rule.label] });
    }
  }
  const tenders = [...tenderMap.values()].filter(({ tender }) =>
    isTenderStillOpen(tender.closingDate),
  );

  return (
    <>
      <PageHeader
        title="Tenders"
        subtitle="Government tenders from the national eTenders portal, Gauteng Health, and Vhembe District Municipality that match your rules, scraped daily."
        actions={<RunScrapeNowButton />}
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <ListFilter className="size-4" />
                Rules
              </span>
            </CardTitle>
            <TenderRuleFormDialog />
          </CardHeader>

          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rules yet — add one to start seeing matching tenders here.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {rules.map((rule) => (
                <TenderRuleRow
                  key={rule.id}
                  rule={{ ...rule, matchCount: rule._count.matches }}
                />
              ))}
            </div>
          )}
        </Card>

        {rules.length === 0 ? null : tenders.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title="No matching tenders yet"
            description="The daily scrape hasn't found a match for your rules yet. Try Scrape now, or widen your rules."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {tenders.map(({ tender, ruleLabels }) => (
              <TenderCard
                key={tender.id}
                tender={{
                  ...tender,
                  documents: tender.documents as { fileName: string; url: string }[] | null,
                  matchedRuleLabels: ruleLabels,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
