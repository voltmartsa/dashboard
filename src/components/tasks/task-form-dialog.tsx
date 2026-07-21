"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask, updateTask } from "@/actions/tasks";
import { PRIORITIES, TASK_STATUSES, PRIORITY_LABEL, STATUS_LABEL } from "@/types";
import type { Area, Priority, TaskStatus } from "@/types";

type TaskFormTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string | null;
};

export function TaskFormDialog({
  area,
  projects,
  task,
  defaultProjectId,
  trigger,
}: {
  area: Area;
  projects: { id: string; name: string }[];
  task?: TaskFormTask;
  defaultProjectId?: string;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(task);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const payload = {
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      area,
      status: String(formData.get("status") || "TODO") as TaskStatus,
      priority: String(formData.get("priority") || "MEDIUM") as Priority,
      dueDate: String(formData.get("dueDate") || "") || undefined,
      projectId:
        String(formData.get("projectId") || "") === "none"
          ? undefined
          : String(formData.get("projectId") || "") || undefined,
    };

    setError(null);
    startTransition(async () => {
      try {
        if (isEdit && task) {
          await updateTask({ ...payload, id: task.id });
        } else {
          await createTask(payload);
        }
        setOpen(false);
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            New task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this task."
              : `Add a task to your ${area === "BUSINESS" ? "Business" : "Personal"} list.`}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="title">
              Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Send client proposal"
              defaultValue={task?.title}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="description">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Optional details..."
              defaultValue={task?.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select name="status" defaultValue={task?.status ?? "TODO"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="dueDate">
                Due date
              </label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={
                  task?.dueDate
                    ? new Date(task.dueDate).toISOString().slice(0, 10)
                    : undefined
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Project</label>
              <Select
                name="projectId"
                defaultValue={task?.projectId ?? defaultProjectId ?? "none"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
