"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { setUserRole, setUserActive, deleteUser } from "@/actions/users";
import { cn, initials, formatDate } from "@/lib/utils";
import type { UserRole } from "@/types";

export type AdminUserData = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  isSelf: boolean;
};

export function UserRow({ user }: { user: AdminUserData }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete ${user.name}'s account? This also deletes everything they own.`)) return;
    startTransition(() => deleteUser(user.id));
  }

  return (
    <div className="flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-black/[0.02] transition-colors">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
        {initials(user.name) || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {user.name}
          {user.isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {user.email} · Joined {formatDate(user.createdAt)}
        </p>
      </div>

      <button
        type="button"
        disabled={user.isSelf || isPending}
        onClick={() =>
          startTransition(() =>
            setUserRole(user.id, user.role === "SUPER_ADMIN" ? "USER" : "SUPER_ADMIN"),
          )
        }
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
          user.role === "SUPER_ADMIN"
            ? "bg-primary-soft text-primary"
            : "bg-black/[0.05] text-muted-foreground hover:bg-black/[0.09]",
        )}
      >
        {user.role === "SUPER_ADMIN" ? "Super admin" : "User"}
      </button>

      <button
        type="button"
        disabled={user.isSelf || isPending}
        onClick={() => startTransition(() => setUserActive(user.id, !user.active))}
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
          user.active ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-danger",
        )}
      >
        {user.active ? "Active" : "Deactivated"}
      </button>

      <button
        type="button"
        disabled={user.isSelf || isPending}
        onClick={handleDelete}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Delete user"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
