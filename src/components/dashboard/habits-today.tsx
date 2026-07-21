"use client";

import { useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleHabitLog } from "@/actions/habits";
import { cn } from "@/lib/utils";

export type HabitTodayData = {
  id: string;
  name: string;
  done: boolean;
};

export function HabitsToday({
  habits,
  todayIso,
}: {
  habits: HabitTodayData[];
  todayIso: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (habits.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No habits tracked yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {habits.map((habit) => (
        <label
          key={habit.id}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Checkbox
            checked={habit.done}
            disabled={isPending}
            onCheckedChange={() =>
              startTransition(() => toggleHabitLog(habit.id, todayIso))
            }
          />
          <span
            className={cn(
              "text-sm text-foreground",
              habit.done && "text-muted-foreground line-through",
            )}
          >
            {habit.name}
          </span>
        </label>
      ))}
    </div>
  );
}
