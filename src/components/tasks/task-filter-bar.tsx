"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIORITIES, PRIORITY_LABEL } from "@/types";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
] as const;

export function TaskFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "all";
  const priority = searchParams.get("priority") ?? "all";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <div className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] p-1 text-sm">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setParam("status", f.value)}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium transition-colors cursor-pointer",
              status === f.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] p-1 text-sm">
        <button
          type="button"
          onClick={() => setParam("priority", "all")}
          className={cn(
            "rounded-full px-3 py-1.5 font-medium transition-colors cursor-pointer",
            priority === "all"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Any priority
        </button>
        {PRIORITIES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setParam("priority", p)}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium transition-colors cursor-pointer",
              priority === p
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PRIORITY_LABEL[p]}
          </button>
        ))}
      </div>
    </div>
  );
}
