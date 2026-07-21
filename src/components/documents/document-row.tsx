"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ExpiryBadge } from "@/components/ui/badge";
import { DocumentFormDialog } from "@/components/documents/document-form-dialog";
import { deleteDocument } from "@/actions/documents";
import { getExpiryStatus } from "@/lib/documents";
import { formatDate } from "@/lib/utils";
import { DOCUMENT_CATEGORY_LABEL } from "@/types";
import type { Area, DocumentCategory } from "@/types";

export type DocumentRowData = {
  id: string;
  name: string;
  category: string;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  notes: string | null;
};

export function DocumentRow({ document, area }: { document: DocumentRowData; area: Area }) {
  const [isPending, startTransition] = useTransition();
  const status = getExpiryStatus(document.expiryDate);

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-black/[0.02] transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{document.name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{DOCUMENT_CATEGORY_LABEL[document.category as DocumentCategory]}</span>
          {document.documentNumber && <span>{document.documentNumber}</span>}
          {document.expiryDate && <span>Expires {formatDate(document.expiryDate)}</span>}
        </div>
      </div>

      <ExpiryBadge status={status} />

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DocumentFormDialog
          area={area}
          document={document}
          trigger={
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-black/[0.05] hover:text-foreground cursor-pointer"
              aria-label="Edit document"
            >
              <Pencil className="size-3.5" />
            </button>
          }
        />
        <button
          type="button"
          onClick={() => startTransition(() => deleteDocument(document.id))}
          disabled={isPending}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer disabled:opacity-50"
          aria-label="Delete document"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
