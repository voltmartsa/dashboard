"use client";

import { useTransition } from "react";
import { setAreaAction } from "@/actions/area";
import { cn } from "@/lib/utils";
import type { Area } from "@/types";

export function AreaSwitcher({ area }: { area: Area }) {
  const [isPending, startTransition] = useTransition();

  function select(next: Area) {
    if (next === area) return;
    startTransition(() => {
      setAreaAction(next);
    });
  }

  return (
    <div className="inline-flex items-center rounded-full bg-black/[0.04] p-1 text-sm">
      {(["BUSINESS", "PERSONAL"] as const).map((option) => (
        <button
          key={option}
          type="button"
          disabled={isPending}
          onClick={() => select(option)}
          className={cn(
            "rounded-full px-4 py-1.5 font-medium transition-colors cursor-pointer disabled:cursor-wait",
            area === option
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option === "BUSINESS" ? "Business" : "Personal"}
        </button>
      ))}
    </div>
  );
}
