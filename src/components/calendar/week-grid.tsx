"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { dayKey, isSameDay } from "@/lib/calendar";
import { AREA_DOT_COLOR, type CalendarItem } from "./calendar-item";
import { DayDetailDialog } from "./day-detail-dialog";
import type { Area } from "@/types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekGrid({
  days,
  itemsByDay,
  defaultArea,
}: {
  days: Date[];
  itemsByDay: Map<string, CalendarItem[]>;
  defaultArea: Area;
}) {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const items = itemsByDay.get(dayKey(day)) ?? [];
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
              className="min-h-[420px] border-r border-border p-2.5 last:border-r-0 text-left hover:bg-black/[0.02] cursor-pointer"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {WEEKDAY_LABELS[day.getDay()]}
                </span>
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {items.map((item) => (
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
              </div>
            </div>
          );
        })}
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
