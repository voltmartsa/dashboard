import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { TaskFilterBar } from "@/components/tasks/task-filter-bar";
import { getCurrentArea } from "@/lib/area";
import { prisma } from "@/lib/prisma";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const area = await getCurrentArea();
  const { status, priority } = await searchParams;

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        area,
        parentTaskId: null,
        ...(status && status !== "all" ? { status } : {}),
        ...(priority && priority !== "all" ? { priority } : {}),
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        subtasks: { select: { id: true, status: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      where: { area },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const statusRank: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 1 };
  tasks.sort((a, b) => statusRank[a.status] - statusRank[b.status]);

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Everything you need to get done, in one list."
        actions={<TaskFormDialog area={area} projects={projects} />}
      />

      <TaskFilterBar />

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description={`Add your first ${area === "BUSINESS" ? "business" : "personal"} task to get started.`}
          action={<TaskFormDialog area={area} projects={projects} />}
        />
      ) : (
        <Card className="p-2">
          <div className="flex flex-col divide-y divide-border">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} area={area} projects={projects} />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
