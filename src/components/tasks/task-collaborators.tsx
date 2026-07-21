"use client";

import { useRef, useState, useTransition } from "react";
import { UserPlus, X } from "lucide-react";
import { addTaskCollaborator, removeTaskCollaborator, assignTask } from "@/actions/collaborators";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials } from "@/lib/utils";

export type CollaboratorPerson = { id: string; name: string; email: string };

export function TaskCollaborators({
  taskId,
  isOwner,
  owner,
  collaborators,
  assigneeId,
}: {
  taskId: string;
  isOwner: boolean;
  owner: CollaboratorPerson;
  collaborators: CollaboratorPerson[];
  assigneeId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd(formData: FormData) {
    const email = String(formData.get("email") || "");
    if (!email.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addTaskCollaborator(taskId, email);
      if (result.ok) {
        if (inputRef.current) inputRef.current.value = "";
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  const assignable = [owner, ...collaborators];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Assigned to</label>
        <Select
          value={assigneeId ?? "none"}
          onValueChange={(value) =>
            startTransition(() => assignTask(taskId, value === "none" ? null : value))
          }
          disabled={!isOwner || isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {assignable.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">Collaborators</p>
        {collaborators.length === 0 && (
          <p className="text-sm text-muted-foreground">Only you can see this task.</p>
        )}
        <div className="flex flex-col gap-1">
          {collaborators.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 hover:bg-black/[0.02]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                  {initials(person.name) || "?"}
                </div>
                <span className="truncate text-sm text-foreground">{person.name}</span>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => startTransition(() => removeTaskCollaborator(taskId, person.id))}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer"
                  aria-label="Remove collaborator"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <form action={handleAdd} className="flex items-center gap-2">
          <input
            ref={inputRef}
            name="email"
            type="email"
            placeholder="Add collaborator by email..."
            className="h-9 flex-1 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <button
            type="submit"
            disabled={isPending}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary hover:bg-primary/15 cursor-pointer disabled:opacity-50"
            aria-label="Add collaborator"
          >
            <UserPlus className="size-4" />
          </button>
        </form>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
