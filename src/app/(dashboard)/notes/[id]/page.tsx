import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NoteEditor } from "@/components/notes/note-editor";
import { prisma } from "@/lib/prisma";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) notFound();

  return (
    <>
      <Link
        href="/notes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-4" />
        Back to notes
      </Link>

      <Card>
        <NoteEditor note={note} />
      </Card>
    </>
  );
}
