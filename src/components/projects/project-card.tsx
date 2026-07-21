import Link from "next/link";
import { Folder } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { formatDueDate } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

export type ProjectCardData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  taskCount: number;
  doneCount: number;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const pct =
    project.taskCount === 0
      ? 0
      : Math.round((project.doneCount / project.taskCount) * 100);
  const dueLabel = formatDueDate(project.dueDate);

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-primary/30 transition-colors h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary shrink-0">
            <Folder className="size-4" />
          </div>
          <ProjectStatusBadge status={project.status as ProjectStatus} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
        {project.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>
              {project.doneCount}/{project.taskCount} tasks
            </span>
            {dueLabel && <span>Due {dueLabel}</span>}
          </div>
          <div className="h-1.5 w-full rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
