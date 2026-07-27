"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { dayKey, isSameDay } from "@/lib/calendar";
import { AREA_DOT_COLOR, type CalendarItem } from "./calendar-item";
import { DayDetailDialog } from "./day-detail-dialog";
import type { Area } from "@/types";

export type { CalendarItem };

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthGrid({
  weeks,
  currentMonth,
  itemsByDay,
  defaultArea,
}: {
  weeks: Date[][];
  currentMonth: number;
  itemsByDay: Map<string, CalendarItem[]>;
  defaultArea: Area;
}) {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-1 py-2 text-[10px] font-medium text-muted-foreground text-center sm:px-3 sm:py-2.5 sm:text-xs"
          >
            <span className="sm:hidden">{label.slice(0, 1)}</span>
            <span className="hidden sm:inline">{label}</span>
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
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDay(day)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedDay(day);
                  }
                }}
                className={cn(
                  "min-h-[56px] border-b border-r border-border p-1 last:border-r-0 text-left hover:bg-black/[0.02] cursor-pointer sm:min-h-[110px] sm:p-2",
                  !inMonth && "bg-black/[0.015]",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full text-[11px] font-medium sm:size-6 sm:text-xs",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {day.getDate()}
                </span>

                {/* Mobile: compact dots, tap for detail */}
                {items.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                    {items.slice(0, 4).map((item) => (
                      <span
                        key={item.id}
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: AREA_DOT_COLOR[item.area] }}
                        aria-hidden
                      />
                    ))}
                  </div>
                )}

                {/* Desktop: full item labels */}
                <div className="mt-1.5 hidden flex-col gap-1 sm:flex">
                  {items.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "flex items-center gap-1 truncate rounded-md px-1.5 py-1 text-[11px] font-medium hover:opacity-80",
                        item.kind === "project"
                          ? "bg-primary-soft text-primary"
                          : item.urgent
                            ? "bg-red-50 text-danger"
                            : "bg-black/[0.05] text-foreground",
                      )}
                    >
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: AREA_DOT_COLOR[item.area] }}
                        aria-hidden
                      />
                      <span className="truncate">{item.title}</span>
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

      <DayDetailDialog
        date={selectedDay}
        items={selectedDay ? itemsByDay.get(dayKey(selectedDay)) ?? [] : []}
        defaultArea={defaultArea}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      />
    </div>
  );
}
