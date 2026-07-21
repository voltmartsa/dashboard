"use client";

import { useTransition } from "react";
import { Trash2, Flame } from "lucide-react";
import { toggleHabitLog, deleteHabit } from "@/actions/habits";
import { isoDateFromUtcMidnight, todayUtcMidnight } from "@/lib/dates";
import { cn } from "@/lib/utils";

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
  const doneCount = days.filter((day) => loggedIsoDates.has(isoDateFromUtcMidnight(day))).length;

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

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          Sessions completed: {doneCount}/{days.length}
        </span>
        <div className="flex items-end gap-1">
          {days.map((day) => {
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
                  "h-7 w-2 rounded-full cursor-pointer transition-colors disabled:cursor-not-allowed",
                  done ? "bg-primary" : "bg-black/[0.08] hover:bg-black/[0.14]",
                  isFuture && "opacity-40",
                )}
              />
            );
          })}
        </div>
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
