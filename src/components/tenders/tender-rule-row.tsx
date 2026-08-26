"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TenderRuleFormDialog } from "@/components/tenders/tender-rule-form-dialog";
import { deleteTenderRule, toggleTenderRuleActive } from "@/actions/tenders";

export type TenderRuleRowData = {
  id: string;
  label: string;
  keywords: string[];
  categories: string[];
  provinces: string[];
  active: boolean;
  matchCount: number;
};

export function TenderRuleRow({ rule }: { rule: TenderRuleRowData }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-black/[0.02] transition-colors">
      <Checkbox
        checked={rule.active}
        onCheckedChange={(checked) =>
          startTransition(() => toggleTenderRuleActive(rule.id, checked === true))
        }
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{rule.label}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {[...rule.keywords, ...rule.categories, ...rule.provinces].slice(0, 6).map((tag) => (
            <span key={tag} className="rounded-full bg-black/[0.05] px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <Badge className="bg-primary-soft text-primary shrink-0">
        {rule.matchCount} match{rule.matchCount === 1 ? "" : "es"}
      </Badge>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TenderRuleFormDialog
          rule={rule}
          trigger={
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-black/[0.05] hover:text-foreground cursor-pointer"
              aria-label="Edit rule"
            >
              <Pencil className="size-3.5" />
            </button>
          }
        />
        <button
          type="button"
          onClick={() => startTransition(() => deleteTenderRule(rule.id))}
          disabled={isPending}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer disabled:opacity-50"
          aria-label="Delete rule"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
