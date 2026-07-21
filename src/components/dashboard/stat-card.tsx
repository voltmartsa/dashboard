import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/dashboard/count-up";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  href,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "danger";
  hint?: string;
  href?: string;
}) {
  const card = (
    <Card
      className={cn(
        "relative h-full overflow-hidden",
        tone === "primary" && "bg-accent-dark text-white border-transparent",
      )}
    >
      {tone === "primary" && (
        <>
          <div className="pointer-events-none absolute -right-8 -top-12 size-40 rounded-full bg-[var(--chart-secondary)] opacity-30 blur-3xl" />
          <div className="pointer-events-none absolute -right-4 top-8 size-32 rounded-full bg-[var(--primary)] opacity-40 blur-3xl" />
        </>
      )}
      <div className="relative z-[1]">
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
        <div className="text-3xl font-semibold">
          {typeof value === "number" ? <CountUp value={value} /> : value}
        </div>
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
      </div>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block h-full">
      {card}
    </Link>
  );
}
