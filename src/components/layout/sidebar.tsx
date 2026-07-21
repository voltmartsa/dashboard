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
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { LogoMark } from "@/components/icons/logo-mark";
import type { CurrentUser } from "@/lib/auth";

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

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent-dark text-white"
          : "text-muted-foreground hover:bg-black/[0.05] hover:text-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={2} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col justify-between py-6 pr-2">
      <div>
        <div className="flex items-center gap-2.5 px-3.5 mb-7">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-accent-dark text-white">
            <LogoMark className="size-[18px]" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-foreground">
            Squash
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
          {isSuperAdmin && (
            <NavLink
              href="/admin"
              label="Admin"
              icon={ShieldCheck}
              active={pathname.startsWith("/admin")}
            />
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-1">
        <NavLink
          href="/settings"
          label="Settings"
          icon={Settings}
          active={pathname.startsWith("/settings")}
        />

        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-black/[0.05] hover:text-foreground cursor-pointer"
          >
            <LogOut className="size-[18px] shrink-0" strokeWidth={2} />
            Log out
          </button>
        </form>

        <div className="mt-2 flex items-center gap-2.5 rounded-full px-3.5 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
            {initials(user.name) || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {isSuperAdmin ? "Super admin" : user.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
