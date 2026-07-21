"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ListChecks,
  FolderKanban,
  NotebookText,
  CalendarDays,
  Repeat,
  Settings,
  Bell,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/auth";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/notes", label: "Notes", icon: NotebookText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/notifications", label: "Alerts", icon: Bell },
];

export function MobileNav({ user }: { user: CurrentUser }) {
  const pathname = usePathname();

  const items = [
    ...NAV_ITEMS,
    ...(user.role === "SUPER_ADMIN"
      ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
      : []),
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[64px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors",
                active
                  ? "bg-accent-dark text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
