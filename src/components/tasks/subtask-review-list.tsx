"use client";

import { Trash2, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITIES, PRIORITY_LABEL } from "@/types";
import type { Priority } from "@/types";

export type ReviewRow = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  selected: boolean;
};

export function SubtaskReviewList({
  rows,
  onChange,
}: {
  rows: ReviewRow[];
  onChange: (rows: ReviewRow[]) => void;
}) {
  function update(id: string, patch: Partial<ReviewRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function remove(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }
  function addManual() {
    onChange([
      ...rows,
      {
        id: `manual-${Date.now()}`,
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
        selected: true,
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto pr-1">
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border p-2.5"
        >
          <Checkbox
            checked={row.selected}
            onCheckedChange={(v) => update(row.id, { selected: Boolean(v) })}
          />
          <Input
            value={row.title}
            onChange={(e) => update(row.id, { title: e.target.value })}
            placeholder="Subtask title"
            className="h-9 flex-1 min-w-[140px]"
          />
          <Select
            value={row.priority}
            onValueChange={(v) => update(row.id, { priority: v as Priority })}
          >
            <SelectTrigger className="w-[104px] h-9 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={row.dueDate}
            onChange={(e) => update(row.id, { dueDate: e.target.value })}
            className="h-9 w-[132px] shrink-0 text-xs"
          />
          <button
            type="button"
            onClick={() => remove(row.id)}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer"
            aria-label="Remove suggestion"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addManual}
        className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 cursor-pointer"
      >
        <Plus className="size-3.5" />
        Add subtask manually
      </button>
    </div>
  );
}
