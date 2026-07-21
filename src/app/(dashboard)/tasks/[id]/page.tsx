import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { SubtaskList } from "@/components/tasks/subtask-list";
import { SubtaskBreakdownDialog } from "@/components/tasks/subtask-breakdown-dialog";
import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import { CompleteTaskButton } from "@/components/tasks/complete-task-button";
import { TaskCollaborators } from "@/components/tasks/task-collaborators";
import { requireUser } from "@/lib/auth";
import { taskAccessWhere, projectAccessWhere } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatDueDate } from "@/lib/utils";
import type { Priority, TaskStatus } from "@/types";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const task = await prisma.task.findFirst({
    where: { id, ...taskAccessWhere(user.id) },
    include: {
      project: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
      collaborators: { include: { user: { select: { id: true, name: true, email: true } } } },
      subtasks: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, status: true, aiGenerated: true, dueDate: true },
      },
    },
  });

  if (!task) notFound();

  const projects = await prisma.project.findMany({
    where: { area: task.area, ...projectAccessWhere(user.id) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const dueLabel = formatDueDate(task.dueDate);
  const doneCount = task.subtasks.filter((s) => s.status === "DONE").length;

  return (
    <>
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-4" />
        Back to tasks
      </Link>

      <Card className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={task.status as TaskStatus} />
              <PriorityBadge priority={task.priority as Priority} />
            </div>
            <h1 className="text-xl font-semibold text-foreground">{task.title}</h1>
            {task.description && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {task.project && (
                <Link href={`/projects/${task.project.id}`} className="hover:underline">
                  {task.project.name}
                </Link>
              )}
              {dueLabel && <span>Due {dueLabel}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CompleteTaskButton id={task.id} status={task.status} />
            <TaskFormDialog
              area={task.area as "BUSINESS" | "PERSONAL"}
              projects={projects}
              task={task}
              trigger={
                <button
                  type="button"
                  className="h-9 rounded-full border border-border px-4 text-sm font-medium hover:bg-black/[0.03] cursor-pointer"
                >
                  Edit
                </button>
              }
            />
            <DeleteTaskButton id={task.id} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Subtasks
            {task.subtasks.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {doneCount}/{task.subtasks.length} done
              </span>
            )}
          </CardTitle>
          <SubtaskBreakdownDialog taskId={task.id} />
        </CardHeader>
        <SubtaskList parentTaskId={task.id} subtasks={task.subtasks} />
      </Card>

      {task.owner && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Collaborators</CardTitle>
          </CardHeader>
          <TaskCollaborators
            taskId={task.id}
            isOwner={task.owner.id === user.id}
            owner={task.owner}
            collaborators={task.collaborators.map((c) => c.user)}
            assigneeId={task.assigneeId}
          />
        </Card>
      )}
    </>
  );
}
