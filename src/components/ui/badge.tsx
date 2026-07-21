import * as React from "react";
import { cn } from "@/lib/utils";
import type { Priority, TaskStatus, ProjectStatus } from "@/types";
import type { ExpiryStatus } from "@/lib/documents";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

const priorityClasses: Record<Priority, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-50 text-blue-600",
  HIGH: "bg-amber-50 text-amber-700",
  URGENT: "bg-red-50 text-red-600",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return <Badge className={priorityClasses[priority]}>{label}</Badge>;
}

const statusClasses: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-primary-soft text-primary",
  DONE: "bg-emerald-100 text-emerald-700",
};

const statusLabel: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={statusClasses[status]}>{statusLabel[status]}</Badge>;
}

const projectStatusClasses: Record<ProjectStatus, string> = {
  PLANNED: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-primary-soft text-primary",
  ON_HOLD: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const projectStatusLabel: Record<ProjectStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge className={projectStatusClasses[status]}>
      {projectStatusLabel[status]}
    </Badge>
  );
}

const expiryClasses: Record<ExpiryStatus, string> = {
  expired: "bg-red-50 text-danger",
  expiring: "bg-amber-50 text-amber-700",
  valid: "bg-emerald-100 text-emerald-700",
  none: "bg-gray-100 text-gray-600",
};

const expiryLabel: Record<ExpiryStatus, string> = {
  expired: "Expired",
  expiring: "Expiring soon",
  valid: "Valid",
  none: "No expiry",
};

export function ExpiryBadge({ status }: { status: ExpiryStatus }) {
  return <Badge className={expiryClasses[status]}>{expiryLabel[status]}</Badge>;
}
