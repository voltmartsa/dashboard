import { Download, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { TENDER_SOURCE_LABEL, TENDER_SOURCE_SITE, type TenderSource } from "@/types";

export type TenderCardData = {
  id: string;
  source: string;
  externalId: string;
  title: string;
  category: string | null;
  province: string | null;
  department: string | null;
  closingDate: Date | null;
  briefingDate: Date | null;
  briefingVenue: string | null;
  sourceUrl: string | null;
  documents: { fileName: string; url: string }[] | null;
  matchedRuleLabels: string[];
};

function sourceLabel(source: string): string {
  return TENDER_SOURCE_LABEL[source as TenderSource] ?? source;
}

function sourceSite(source: string): string {
  return TENDER_SOURCE_SITE[source as TenderSource] ?? "source";
}

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function TenderCard({ tender }: { tender: TenderCardData }) {
  const days = daysUntil(tender.closingDate);
  const urgent = days !== null && days <= 5;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{tender.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {tender.externalId} · {tender.department ?? "Unknown department"}
          </p>
        </div>
        {tender.closingDate && (
          <Badge
            className={
              urgent ? "bg-red-50 text-danger shrink-0" : "bg-black/[0.05] text-muted-foreground shrink-0"
            }
          >
            {days !== null && days >= 0
              ? `Closes in ${days}d`
              : days !== null && days < 0
                ? "Closed"
                : "No closing date"}
          </Badge>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {sourceLabel(tender.source)}
        </span>
        {tender.category && (
          <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-xs text-muted-foreground">
            {tender.category}
          </span>
        )}
        {tender.province && (
          <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-xs text-muted-foreground">
            {tender.province}
          </span>
        )}
        {tender.matchedRuleLabels.map((label) => (
          <span key={label} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">
            {label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Closes {formatDate(tender.closingDate) ?? "—"}</span>
        {tender.briefingDate && (
          <span>
            Briefing {formatDate(tender.briefingDate)}
            {tender.briefingVenue ? ` · ${tender.briefingVenue}` : ""}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {tender.sourceUrl && (
          <a
            href={tender.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" />
            View on {sourceSite(tender.source)}
          </a>
        )}
        {tender.documents?.map((doc) => (
          <a
            key={doc.url}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Download className="size-3.5" />
            {doc.fileName}
          </a>
        ))}
      </div>
    </Card>
  );
}
