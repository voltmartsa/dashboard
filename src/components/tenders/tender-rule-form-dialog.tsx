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
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryMultiSelect } from "@/components/tenders/category-multi-select";
import { createTenderRule, updateTenderRule } from "@/actions/tenders";
import { SA_PROVINCES } from "@/types";
import type { SAProvince, EtendersCategory } from "@/types";

type TenderRuleFormRule = {
  id: string;
  label: string;
  keywords: string[];
  categories: string[];
  provinces: string[];
};

export function TenderRuleFormDialog({
  rule,
  trigger,
}: {
  rule?: TenderRuleFormRule;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(rule);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<SAProvince[]>(
    (rule?.provinces as SAProvince[]) ?? [],
  );
  const [categories, setCategories] = useState<EtendersCategory[]>(
    (rule?.categories as EtendersCategory[]) ?? [],
  );

  function toggleProvince(province: SAProvince, checked: boolean) {
    setProvinces((prev) =>
      checked ? [...prev, province] : prev.filter((p) => p !== province),
    );
  }

  function handleSubmit(formData: FormData) {
    const payload = {
      label: String(formData.get("label") || ""),
      keywords: String(formData.get("keywords") || ""),
      categories,
      provinces,
      active: true,
    };

    setError(null);
    startTransition(async () => {
      try {
        if (isEdit && rule) {
          await updateTenderRule(rule.id, payload);
        } else {
          await createTenderRule(payload);
        }
        setOpen(false);
      } catch {
        setError("Add at least one keyword, category, or province.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            New rule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit rule" : "New tender rule"}</DialogTitle>
          <DialogDescription>
            Tenders scraped daily from eTenders that match this rule show up in your Tenders
            tab and trigger a push notification.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="label">
              Label
            </label>
            <Input
              id="label"
              name="label"
              placeholder="e.g. IT tenders in Gauteng"
              defaultValue={rule?.label}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="keywords">
              Keywords
            </label>
            <Input
              id="keywords"
              name="keywords"
              placeholder="e.g. software, network, cctv"
              defaultValue={rule?.keywords.join(", ")}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated. Matches if the tender title or category contains any of these.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Categories</span>
            <CategoryMultiSelect value={categories} onChange={setCategories} />
            <p className="text-xs text-muted-foreground">
              From eTenders&apos; own category list. Leave empty to match any category.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Provinces</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {SA_PROVINCES.map((province) => (
                <label
                  key={province}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <Checkbox
                    checked={provinces.includes(province)}
                    onCheckedChange={(checked) => toggleProvince(province, checked === true)}
                  />
                  {province}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Leave all unchecked to match any province.</p>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Add rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
