"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toggleTaskStatus } from "@/actions/tasks";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

export function CompleteTaskButton({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const done = status === "DONE";

  function handleClick() {
    if (!done) fireConfetti();
    startTransition(() => toggleTaskStatus(id));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium cursor-pointer disabled:opacity-50",
        done
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-primary text-primary-foreground hover:bg-primary-hover",
      )}
    >
      <Check className="size-3.5" />
      {done ? "Completed" : "Mark complete"}
    </button>
  );
}
