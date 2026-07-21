"use client";

import { useRef, useState, useTransition } from "react";
import { UserPlus, X } from "lucide-react";
import { addProjectCollaborator, removeProjectCollaborator } from "@/actions/collaborators";
import { initials } from "@/lib/utils";
import type { CollaboratorPerson } from "@/components/tasks/task-collaborators";

export function ProjectCollaborators({
  projectId,
  isOwner,
  collaborators,
}: {
  projectId: string;
  isOwner: boolean;
  collaborators: CollaboratorPerson[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd(formData: FormData) {
    const email = String(formData.get("email") || "");
    if (!email.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addProjectCollaborator(projectId, email);
      if (result.ok) {
        if (inputRef.current) inputRef.current.value = "";
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      {collaborators.length === 0 && (
        <p className="text-sm text-muted-foreground">Only you can see this project.</p>
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
                onClick={() => startTransition(() => removeProjectCollaborator(projectId, person.id))}
                className="rounded-lg p-1 text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer"
                aria-label="Remove collaborator"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <form action={handleAdd} className="mt-1 flex items-center gap-2">
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
