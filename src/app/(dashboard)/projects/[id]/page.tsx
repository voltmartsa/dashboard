import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { ProjectCollaborators } from "@/components/projects/project-collaborators";
import { getCurrentArea } from "@/lib/area";
import { requireUser } from "@/lib/auth";
import { projectAccessWhere } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatDueDate } from "@/lib/utils";
import type { Area, ProjectStatus } from "@/types";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const project = await prisma.project.findFirst({
    where: { id, ...projectAccessWhere(user.id) },
    include: {
      tasks: {
        where: { parentTaskId: null },
        include: {
          project: { select: { id: true, name: true, color: true } },
          subtasks: { select: { id: true, status: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      },
      collaborators: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!project) notFound();

  const area = await getCurrentArea();
  const projects = await prisma.project.findMany({
    where: { area: project.area, ...projectAccessWhere(user.id) },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const dueLabel = formatDueDate(project.dueDate);
  const doneCount = project.tasks.filter((t) => t.status === "DONE").length;
  const tasks = [...project.tasks].sort((a, b) => {
    const rank = (s: string) => (s === "DONE" ? 1 : 0);
    return rank(a.status) - rank(b.status);
  });

  return (
    <>
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </Link>

      <Card className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2">
              <ProjectStatusBadge status={project.status as ProjectStatus} />
            </div>
            <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {project.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                {doneCount}/{project.tasks.length} tasks done
              </span>
              {dueLabel && <span>Due {dueLabel}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ProjectFormDialog
              area={project.area as Area}
              project={project}
              trigger={
                <button
                  type="button"
                  className="h-9 rounded-full border border-border px-4 text-sm font-medium hover:bg-black/[0.03] cursor-pointer"
                >
                  Edit
                </button>
              }
            />
            <DeleteProjectButton id={project.id} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <TaskFormDialog
            area={area}
            projects={projects}
            defaultProjectId={project.id}
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-8 rounded-full bg-primary-soft text-primary px-3.5 text-sm font-medium hover:bg-primary/15 cursor-pointer"
              >
                + Add task
              </button>
            }
          />
        </CardHeader>

        {tasks.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No tasks in this project yet"
            description="Add a task to start tracking work here."
          />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} area={project.area as Area} projects={projects} />
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Collaborators</CardTitle>
        </CardHeader>
        <ProjectCollaborators
          projectId={project.id}
          isOwner={project.ownerId === user.id}
          collaborators={project.collaborators.map((c) => c.user)}
        />
      </Card>
    </>
  );
}
