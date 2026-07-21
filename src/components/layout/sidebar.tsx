"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/notes", label: "Notes", icon: NotebookText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between px-4 py-6">
      <div>
        <div className="flex items-center gap-2 px-3 mb-8">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            F
          </div>
          <span className="text-[17px] font-semibold tracking-tight">
            Foundry
          </span>
        </div>

        <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          Menu
        </p>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <Icon className="size-[18px]" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          General
        </p>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-primary-soft text-primary"
              : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground",
          )}
        >
          <Settings className="size-[18px]" strokeWidth={2} />
          Settings
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-black/[0.03] hover:text-foreground cursor-pointer"
          >
            <LogOut className="size-[18px]" strokeWidth={2} />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
