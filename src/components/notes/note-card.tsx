import Link from "next/link";
import { Pin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export type NoteCardData = {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  pinned: boolean;
  updatedAt: Date;
};

export function NoteCard({ note }: { note: NoteCardData }) {
  const snippet = note.content.replace(/[#*_`>-]/g, "").slice(0, 140);
  const tags = note.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="hover:border-primary/30 transition-colors h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
            {note.title}
          </h3>
          {note.pinned && <Pin className="size-3.5 text-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-3 flex-1">
          {snippet || "Empty note"}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {formatDate(note.updatedAt)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
