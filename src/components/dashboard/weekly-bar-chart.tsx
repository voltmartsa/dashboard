import { cn } from "@/lib/utils";

export type WeeklyBarDatum = {
  label: string;
  value: number;
  isToday?: boolean;
};

export function WeeklyBarChart({ data }: { data: WeeklyBarDatum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-2.5 h-32">
      {data.map((d, i) => {
        const heightPct = d.value === 0 ? 100 : Math.max((d.value / max) * 100, 14);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-24 w-full items-end">
              <div
                className={cn(
                  "w-full rounded-full transition-all",
                  d.value === 0 ? "hatch-pattern" : "bg-primary",
                )}
                style={{ height: `${heightPct}%` }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                d.isToday ? "text-primary" : "text-muted-foreground",
              )}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
