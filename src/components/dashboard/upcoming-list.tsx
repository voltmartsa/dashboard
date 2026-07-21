import Link from "next/link";
import { ListChecks, Folder } from "lucide-react";
import { cn, formatDueDate } from "@/lib/utils";

export type UpcomingItem = {
  id: string;
  title: string;
  href: string;
  dueDate: Date;
  kind: "task" | "project";
};

export function UpcomingList({ items }: { items: UpcomingItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nothing coming up. Enjoy the calm.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {items.map((item) => {
        const overdue = item.dueDate < new Date(new Date().toDateString());
        return (
          <Link
            key={`${item.kind}-${item.id}`}
            href={item.href}
            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
          >
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg shrink-0",
                item.kind === "project"
                  ? "bg-primary-soft text-primary"
                  : "bg-black/[0.05] text-foreground",
              )}
            >
              {item.kind === "project" ? (
                <Folder className="size-3.5" />
              ) : (
                <ListChecks className="size-3.5" />
              )}
            </div>
            <span className="flex-1 min-w-0 truncate text-sm font-medium text-foreground">
              {item.title}
            </span>
            <span
              className={cn(
                "shrink-0 text-xs",
                overdue ? "text-danger font-medium" : "text-muted-foreground",
              )}
            >
              {formatDueDate(item.dueDate)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
