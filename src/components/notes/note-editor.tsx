"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import { Pin, Trash2, Eye, Pencil } from "lucide-react";
import { updateNote, togglePinned, deleteNote } from "@/actions/notes";
import { cn } from "@/lib/utils";

export type NoteEditorData = {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  pinned: boolean;
};

export function NoteEditor({ note }: { note: NoteEditorData }) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags ?? "");
  const [pinned, setPinned] = useState(note.pinned);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(next: { title?: string; content?: string; tags?: string }) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      startTransition(() => {
        updateNote({
          id: note.id,
          title: next.title ?? title,
          content: next.content ?? content,
          tags: next.tags ?? tags,
        });
      });
    }, 600);
  }

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  function handlePin() {
    setPinned((p) => !p);
    startTransition(() => togglePinned(note.id));
  }

  function handleDelete() {
    if (!confirm("Delete this note?")) return;
    startDeleting(async () => {
      await deleteNote(note.id);
      router.push("/notes");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave({ title: e.target.value });
          }}
          placeholder="Note title"
          className="flex-1 bg-transparent text-xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-muted-foreground mr-1 w-14 text-right">
            {isPending ? "Saving..." : "Saved"}
          </span>
          <button
            type="button"
            onClick={handlePin}
            className={cn(
              "flex size-8 items-center justify-center rounded-full border cursor-pointer",
              pinned
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-muted-foreground hover:bg-black/[0.03]",
            )}
            aria-label="Pin note"
          >
            <Pin className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer disabled:opacity-50"
            aria-label="Delete note"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <input
        value={tags}
        onChange={(e) => {
          setTags(e.target.value);
          scheduleSave({ tags: e.target.value });
        }}
        placeholder="Tags, comma-separated (e.g. research, pricing)"
        className="bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/70"
      />

      <div className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] p-1 text-sm w-fit">
        <button
          type="button"
          onClick={() => setMode("write")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium cursor-pointer",
            mode === "write"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Pencil className="size-3.5" />
          Write
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium cursor-pointer",
            mode === "preview"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Eye className="size-3.5" />
          Preview
        </button>
      </div>

      {mode === "write" ? (
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            scheduleSave({ content: e.target.value });
          }}
          placeholder="Write in markdown..."
          className="min-h-[50vh] w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground font-mono"
        />
      ) : (
        <div
          className="prose-note min-h-[50vh] text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: marked.parse(content || "*Nothing to preview yet.*") }}
        />
      )}
    </div>
  );
}
