"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ETENDERS_CATEGORIES } from "@/types";
import type { EtendersCategory } from "@/types";

export function CategoryMultiSelect({
  value,
  onChange,
}: {
  value: EtendersCategory[];
  onChange: (value: EtendersCategory[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const filtered = ETENDERS_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase()),
  );

  function toggle(category: EtendersCategory, checked: boolean) {
    onChange(checked ? [...value, category] : value.filter((c) => c !== category));
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground cursor-pointer"
      >
        <span className={cn("truncate text-left", value.length === 0 && "text-muted-foreground")}>
          {value.length === 0 ? "Any category" : `${value.length} selected`}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {value.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {value.map((category) => (
            <span
              key={category}
              className="flex max-w-full items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary"
            >
              <span className="truncate">{category}</span>
              <button
                type="button"
                onClick={() => toggle(category, false)}
                className="cursor-pointer"
                aria-label={`Remove ${category}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card p-2 shadow-[0_12px_28px_rgba(28,26,22,0.12)]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories..."
            autoFocus
            className="mb-2 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          />
          <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
            {filtered.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted-foreground">No matches.</p>
            ) : (
              filtered.map((category) => (
                <label
                  key={category}
                  className="flex items-start gap-2 rounded-lg px-1.5 py-1 text-sm text-foreground hover:bg-black/[0.04] cursor-pointer"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={value.includes(category)}
                    onCheckedChange={(checked) => toggle(category, checked === true)}
                  />
                  <span>{category}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
