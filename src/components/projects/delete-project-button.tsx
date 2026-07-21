"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProject } from "@/actions/projects";

export function DeleteProjectButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this project? Its tasks will be kept, unlinked.")) return;
    startTransition(async () => {
      await deleteProject(id);
      router.push("/projects");
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer disabled:opacity-50"
      aria-label="Delete project"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
