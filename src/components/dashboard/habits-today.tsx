"use client";

import { useTransition } from "react";
import { Flame } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleHabitLog } from "@/actions/habits";
import { fireBigConfetti, fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

export type HabitTodayData = {
  id: string;
  name: string;
  done: boolean;
  streak: number;
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

  function handleToggle(habit: HabitTodayData) {
    if (!habit.done) {
      const allOtherHabitsDone = habits.every((h) => h.id === habit.id || h.done);
      if (allOtherHabitsDone) {
        fireBigConfetti();
      } else {
        fireConfetti();
      }
    }
    startTransition(() => toggleHabitLog(habit.id, todayIso));
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
            onCheckedChange={() => handleToggle(habit)}
          />
          <span
            className={cn(
              "text-sm text-foreground",
              habit.done && "text-muted-foreground line-through",
            )}
          >
            {habit.name}
          </span>
          {habit.streak > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-amber-600">
              <Flame className="size-3" />
              {habit.streak}
            </span>
          )}
        </label>
      ))}
    </div>
  );
}
