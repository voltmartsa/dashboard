import Link from "next/link";
import { cn } from "@/lib/utils";
import { dayKey, isSameDay } from "@/lib/calendar";

export type CalendarItem = {
  id: string;
  title: string;
  href: string;
  kind: "task" | "project";
  urgent?: boolean;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthGrid({
  weeks,
  currentMonth,
  itemsByDay,
}: {
  weeks: Date[][];
  currentMonth: number;
  itemsByDay: Map<string, CalendarItem[]>;
}) {
  const today = new Date();

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-center"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flatMap((week) =>
          week.map((day) => {
            const items = itemsByDay.get(dayKey(day)) ?? [];
            const inMonth = day.getMonth() === currentMonth;
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[110px] border-b border-r border-border p-2 last:border-r-0",
                  !inMonth && "bg-black/[0.015]",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1.5 flex flex-col gap-1">
                  {items.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "block truncate rounded-md px-1.5 py-1 text-[11px] font-medium hover:opacity-80",
                        item.kind === "project"
                          ? "bg-primary-soft text-primary"
                          : item.urgent
                            ? "bg-red-50 text-danger"
                            : "bg-black/[0.05] text-foreground",
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                  {items.length > 3 && (
                    <span className="px-1.5 text-[11px] text-muted-foreground">
                      +{items.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
