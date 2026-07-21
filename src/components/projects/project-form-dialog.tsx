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
import { createProject, updateProject } from "@/actions/projects";
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL } from "@/types";
import type { Area, ProjectStatus } from "@/types";

type ProjectFormProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
};

export function ProjectFormDialog({
  area,
  project,
  trigger,
}: {
  area: Area;
  project?: ProjectFormProject;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(project);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const payload = {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      area,
      status: String(formData.get("status") || "ACTIVE") as ProjectStatus,
      dueDate: String(formData.get("dueDate") || "") || undefined,
    };

    setError(null);
    startTransition(async () => {
      try {
        if (isEdit && project) {
          await updateProject({ ...payload, id: project.id });
        } else {
          await createProject(payload);
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
            New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this project."
              : `Add a project to your ${area === "BUSINESS" ? "Business" : "Personal"} list.`}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Name
            </label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Website relaunch"
              defaultValue={project?.name}
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
              defaultValue={project?.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select name="status" defaultValue={project?.status ?? "ACTIVE"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PROJECT_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="dueDate">
                Due date
              </label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={
                  project?.dueDate
                    ? new Date(project.dueDate).toISOString().slice(0, 10)
                    : undefined
                }
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
