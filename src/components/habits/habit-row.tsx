"use client";

import { useTransition } from "react";
import { Trash2, Flame } from "lucide-react";
import { toggleHabitLog, deleteHabit } from "@/actions/habits";
import { isoDateFromUtcMidnight, todayUtcMidnight } from "@/lib/dates";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function HabitRow({
  habit,
  days,
  loggedIsoDates,
  streak,
}: {
  habit: { id: string; name: string };
  days: Date[];
  loggedIsoDates: Set<string>;
  streak: number;
}) {
  const [isPending, startTransition] = useTransition();
  const today = todayUtcMidnight();

  return (
    <div className="flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-black/[0.02] transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{habit.name}</p>
        {streak > 0 && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
            <Flame className="size-3" />
            {streak} day{streak === 1 ? "" : "s"} streak
          </p>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {days.map((day, i) => {
          const iso = isoDateFromUtcMidnight(day);
          const done = loggedIsoDates.has(iso);
          const isFuture = day.getTime() > today.getTime();

          return (
            <button
              key={iso}
              type="button"
              disabled={isFuture || isPending}
              onClick={() => startTransition(() => toggleHabitLog(habit.id, iso))}
              title={iso}
              className={cn(
                "flex size-8 flex-col items-center justify-center rounded-full text-[10px] font-medium leading-none cursor-pointer transition-colors disabled:cursor-not-allowed",
                done
                  ? "bg-primary text-primary-foreground"
                  : "bg-black/[0.05] text-muted-foreground hover:bg-black/[0.09]",
                isFuture && "opacity-40",
              )}
            >
              <span>{DAY_LABELS[i]}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => startTransition(() => deleteHabit(habit.id))}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer"
        aria-label="Delete habit"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
