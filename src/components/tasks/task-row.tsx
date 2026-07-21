"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/components/ui/badge";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { toggleTaskStatus, deleteTask } from "@/actions/tasks";
import { cn, formatDueDate } from "@/lib/utils";
import type { Area, Priority } from "@/types";

export type TaskRowData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string | null;
  project: { id: string; name: string; color: string | null } | null;
  subtasks: { id: string; status: string }[];
};

export function TaskRow({
  task,
  area,
  projects,
  linkToDetail = true,
}: {
  task: TaskRowData;
  area: Area;
  projects: { id: string; name: string }[];
  linkToDetail?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const done = task.status === "DONE";
  const dueLabel = formatDueDate(task.dueDate);
  const overdue = task.dueDate && !done && new Date(task.dueDate) < new Date(new Date().toDateString());
  const subtaskDone = task.subtasks.filter((s) => s.status === "DONE").length;

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-black/[0.02] transition-colors">
      <Checkbox
        checked={done}
        onCheckedChange={() => startTransition(() => toggleTaskStatus(task.id))}
        disabled={isPending}
      />

      <div className="min-w-0 flex-1">
        {linkToDetail ? (
          <Link
            href={`/tasks/${task.id}`}
            className={cn(
              "text-sm font-medium text-foreground hover:underline underline-offset-2",
              done && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </Link>
        ) : (
          <span
            className={cn(
              "text-sm font-medium text-foreground",
              done && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </span>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.project && <span>{task.project.name}</span>}
          {task.subtasks.length > 0 && (
            <span>
              {subtaskDone}/{task.subtasks.length} subtasks
            </span>
          )}
          {dueLabel && (
            <span className={cn(overdue && "text-danger font-medium")}>{dueLabel}</span>
          )}
        </div>
      </div>

      <PriorityBadge priority={task.priority as Priority} />

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TaskFormDialog
          area={area}
          projects={projects}
          task={task}
          trigger={
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-black/[0.05] hover:text-foreground cursor-pointer"
              aria-label="Edit task"
            >
              <Pencil className="size-3.5" />
            </button>
          }
        />
        <button
          type="button"
          onClick={() => startTransition(() => deleteTask(task.id))}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer"
          aria-label="Delete task"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AiGeneratedTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
      <Sparkles className="size-3" />
      AI
    </span>
  );
}
