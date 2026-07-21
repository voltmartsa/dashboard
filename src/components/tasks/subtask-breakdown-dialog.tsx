"use client";

import { useState, useTransition } from "react";
import { ListTree, Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getSubtaskSuggestions, createSubtasksFromSuggestions } from "@/actions/tasks";
import { SubtaskReviewList, type ReviewRow } from "@/components/tasks/subtask-review-list";

export function SubtaskBreakdownDialog({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && rows === null) {
      setError(null);
      startLoading(async () => {
        try {
          const suggestions = await getSubtaskSuggestions(taskId);
          setRows(
            suggestions.map((s, i) => ({
              id: `${i}-${s.title}`,
              title: s.title,
              description: s.description ?? "",
              priority: s.priority ?? "MEDIUM",
              dueDate: "",
              selected: true,
            })),
          );
        } catch {
          setError(
            "Couldn't generate subtasks. Check that ANTHROPIC_API_KEY is set in .env and try again.",
          );
        }
      });
    }
    if (!next) {
      setRows(null);
      setError(null);
    }
  }

  function handleConfirm() {
    if (!rows) return;
    const selected = rows.filter((r) => r.selected && r.title.trim());
    if (selected.length === 0) {
      setOpen(false);
      return;
    }
    startSaving(async () => {
      await createSubtasksFromSuggestions({
        parentTaskId: taskId,
        subtasks: selected.map((r) => ({
          title: r.title.trim(),
          description: r.description.trim() || undefined,
          priority: r.priority,
          dueDate: r.dueDate || undefined,
        })),
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-8 rounded-full bg-primary-soft text-primary px-3.5 text-sm font-medium hover:bg-primary/15 cursor-pointer"
        >
          <ListTree className="size-3.5" />
          Break into subtasks
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Break into subtasks
          </DialogTitle>
          <DialogDescription>
            Review the suggested subtasks, edit anything, then add the ones you want.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Thinking through the steps...
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {rows && !isLoading && <SubtaskReviewList rows={rows} onChange={setRows} />}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!rows || rows.length === 0 || isSaving}
          >
            {isSaving ? "Adding..." : "Add selected subtasks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
