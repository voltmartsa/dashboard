"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDocument, updateDocument } from "@/actions/documents";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABEL } from "@/types";
import type { Area, DocumentCategory } from "@/types";

type DocumentFormDocument = {
  id: string;
  name: string;
  category: string;
  documentNumber: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  notes: string | null;
};

function toDateInputValue(date: Date | null) {
  return date ? new Date(date).toISOString().slice(0, 10) : undefined;
}

export function DocumentFormDialog({
  area,
  document,
  trigger,
}: {
  area: Area;
  document?: DocumentFormDocument;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(document);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name") || ""),
      category: String(formData.get("category") || "OTHER") as DocumentCategory,
      area,
      documentNumber: String(formData.get("documentNumber") || ""),
      issueDate: String(formData.get("issueDate") || "") || undefined,
      expiryDate: String(formData.get("expiryDate") || "") || undefined,
      notes: String(formData.get("notes") || ""),
    };

    setError(null);
    startTransition(async () => {
      try {
        if (isEdit && document) {
          await updateDocument({ ...payload, id: document.id });
        } else {
          await createDocument(payload);
        }
        setOpen(false);
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            New document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit document" : "New document"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this document."
              : `Track a ${area === "BUSINESS" ? "business" : "personal"} document and its expiry.`}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Name
            </label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Driver's License, Passport"
              defaultValue={document?.name}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Category</label>
              <Select name="category" defaultValue={document?.category ?? "OTHER"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {DOCUMENT_CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="documentNumber">
                Document number
              </label>
              <Input
                id="documentNumber"
                name="documentNumber"
                placeholder="Optional"
                defaultValue={document?.documentNumber ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="issueDate">
                Issue date
              </label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                defaultValue={toDateInputValue(document?.issueDate ?? null)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="expiryDate">
                Expiry date
              </label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                defaultValue={toDateInputValue(document?.expiryDate ?? null)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="notes">
              Notes
            </label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Optional details..."
              defaultValue={document?.notes ?? ""}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Add document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
