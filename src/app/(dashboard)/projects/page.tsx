import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { getCurrentArea } from "@/lib/area";
import { prisma } from "@/lib/prisma";

export default async function ProjectsPage() {
  const area = await getCurrentArea();

  const projects = await prisma.project.findMany({
    where: { area },
    include: { tasks: { select: { status: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Group related tasks and track progress."
        actions={<ProjectFormDialog area={area} />}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={`Create a ${area === "BUSINESS" ? "business" : "personal"} project to start grouping tasks together.`}
          action={<ProjectFormDialog area={area} />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={{
                ...project,
                taskCount: project.tasks.length,
                doneCount: project.tasks.filter((t) => t.status === "DONE").length,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
