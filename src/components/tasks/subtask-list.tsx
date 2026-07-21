"use client";

import { useRef, useTransition } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AiGeneratedTag } from "@/components/tasks/task-row";
import { toggleTaskStatus, deleteTask, addSubtask, updateSubtaskDueDate } from "@/actions/tasks";
import { cn, formatDueDate } from "@/lib/utils";

export type SubtaskData = {
  id: string;
  title: string;
  status: string;
  aiGenerated: boolean;
  dueDate: Date | null;
};

function toDateInputValue(date: Date | null) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

export function SubtaskList({
  parentTaskId,
  subtasks,
}: {
  parentTaskId: string;
  subtasks: SubtaskData[];
}) {
  const [isPending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  function handleAdd(formData: FormData) {
    const title = String(formData.get("title") || "");
    const dueDate = String(formData.get("dueDate") || "");
    if (!title.trim()) return;
    startTransition(() => addSubtask(parentTaskId, title, dueDate || undefined));
    if (titleRef.current) titleRef.current.value = "";
    if (dateRef.current) dateRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-1">
      {subtasks.map((subtask) => {
        const done = subtask.status === "DONE";
        const dueLabel = formatDueDate(subtask.dueDate);
        const overdue =
          subtask.dueDate && !done && new Date(subtask.dueDate) < new Date(new Date().toDateString());

        return (
          <div
            key={subtask.id}
            className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-black/[0.02] transition-colors"
          >
            <Checkbox
              checked={done}
              disabled={isPending}
              onCheckedChange={() => startTransition(() => toggleTaskStatus(subtask.id))}
            />
            <span
              className={cn(
                "flex-1 text-sm text-foreground",
                done && "line-through text-muted-foreground",
              )}
            >
              {subtask.title}
            </span>
            {subtask.aiGenerated && <AiGeneratedTag />}

            <label
              className={cn(
                "relative flex items-center gap-1 rounded-md px-1.5 py-1 text-xs cursor-pointer hover:bg-black/[0.05]",
                overdue ? "text-danger font-medium" : "text-muted-foreground",
                !dueLabel && "opacity-0 group-hover:opacity-100 transition-opacity",
              )}
            >
              <CalendarDays className="size-3" />
              {dueLabel ?? "Due date"}
              <input
                type="date"
                defaultValue={toDateInputValue(subtask.dueDate)}
                onChange={(e) =>
                  startTransition(() => updateSubtaskDueDate(subtask.id, e.target.value))
                }
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>

            <button
              type="button"
              onClick={() => startTransition(() => deleteTask(subtask.id))}
              className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-danger transition-opacity cursor-pointer"
              aria-label="Delete subtask"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      })}

      <form action={handleAdd} className="flex items-center gap-2 mt-1 px-2">
        <Plus className="size-4 text-muted-foreground shrink-0" />
        <input
          ref={titleRef}
          name="title"
          placeholder="Add a subtask..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1.5"
        />
        <input
          ref={dateRef}
          name="dueDate"
          type="date"
          className="bg-transparent text-xs text-muted-foreground outline-none py-1.5 shrink-0"
        />
      </form>
    </div>
  );
}
