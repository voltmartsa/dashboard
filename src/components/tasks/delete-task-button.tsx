"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTask } from "@/actions/tasks";

export function DeleteTaskButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this task and all its subtasks?")) return;
    startTransition(async () => {
      await deleteTask(id);
      router.push("/tasks");
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer disabled:opacity-50"
      aria-label="Delete task"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
