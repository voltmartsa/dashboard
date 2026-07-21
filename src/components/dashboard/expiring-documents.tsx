import Link from "next/link";
import { FileText } from "lucide-react";
import { ExpiryBadge } from "@/components/ui/badge";
import { getExpiryStatus } from "@/lib/documents";
import { formatDate } from "@/lib/utils";

export type ExpiringDocumentItem = {
  id: string;
  name: string;
  expiryDate: Date | null;
};

export function ExpiringDocuments({ documents }: { documents: ExpiringDocumentItem[] }) {
  if (documents.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nothing expiring soon.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {documents.map((doc) => (
        <Link
          key={doc.id}
          href="/documents"
          className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-black/[0.05] text-foreground shrink-0">
            <FileText className="size-3.5" />
          </div>
          <span className="flex-1 min-w-0 truncate text-sm font-medium text-foreground">
            {doc.name}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDate(doc.expiryDate)}
          </span>
          <ExpiryBadge status={getExpiryStatus(doc.expiryDate)} />
        </Link>
      ))}
    </div>
  );
}
