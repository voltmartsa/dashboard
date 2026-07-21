import { NotebookText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { NewNoteButton } from "@/components/notes/new-note-button";
import { NoteCard } from "@/components/notes/note-card";
import { getCurrentArea } from "@/lib/area";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotesPage() {
  const [area, user] = await Promise.all([getCurrentArea(), requireUser()]);

  const notes = await prisma.note.findMany({
    where: { area, ownerId: user.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Notes"
        subtitle="Research, ideas, and reference material."
        actions={<NewNoteButton area={area} />}
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookText}
          title="No notes yet"
          description="Jot down research, meeting notes, or ideas — link them to a task or project later."
          action={<NewNoteButton area={area} />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </>
  );
}
