import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "danger";
  hint?: string;
}) {
  return (
    <Card
      className={cn(
        tone === "primary" && "bg-accent-dark text-white border-transparent",
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            "text-sm font-medium",
            tone === "primary" ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            tone === "primary"
              ? "bg-white/15 text-white"
              : tone === "danger"
                ? "bg-red-50 text-danger"
                : "bg-primary-soft text-primary",
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-3xl font-semibold">{value}</div>
      {hint && (
        <p
          className={cn(
            "mt-1.5 text-xs",
            tone === "primary" ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      )}
    </Card>
  );
}
