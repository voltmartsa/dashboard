"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createNote } from "@/actions/notes";
import type { Area } from "@/types";

export function NewNoteButton({ area }: { area: Area }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const { id } = await createNote(area);
      router.push(`/notes/${id}`);
    });
  }

  return (
    <Button size="sm" onClick={handleClick} disabled={isPending}>
      <Plus className="size-4" />
      New note
    </Button>
  );
}
