import Link from "next/link";
import { FolderKanban, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { getCurrentArea } from "@/lib/area";
import { requireUser } from "@/lib/auth";
import { projectAccessWhere } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { PROJECT_STATUS_LABEL } from "@/types";
import type { ProjectStatus } from "@/types";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [area, user] = await Promise.all([getCurrentArea(), requireUser()]);
  const { status } = await searchParams;

  const projects = await prisma.project.findMany({
    where: { area, ...projectAccessWhere(user.id), ...(status ? { status } : {}) },
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

      {status && (
        <Link
          href="/projects"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
        >
          {PROJECT_STATUS_LABEL[status as ProjectStatus] ?? status}
          <X className="size-3" />
        </Link>
      )}

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
