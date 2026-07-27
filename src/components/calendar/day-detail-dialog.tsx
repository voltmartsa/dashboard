"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createTask, toggleTaskStatus } from "@/actions/tasks";
import { dateParam } from "@/lib/calendar";
import { AREA_LABEL, AREAS } from "@/types";
import type { Area } from "@/types";
import { AREA_DOT_COLOR, type CalendarItem } from "./calendar-item";

export function DayDetailDialog({
  date,
  items,
  defaultArea,
  onOpenChange,
}: {
  date: Date | null;
  items: CalendarItem[];
  defaultArea: Area;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<Area>(defaultArea);
  const [error, setError] = useState<string | null>(null);

  const open = date !== null;
  const label = date
    ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date)
    : "";

  function handleAdd() {
    if (!date || !title.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createTask({ title: title.trim(), area, status: "TODO", priority: "MEDIUM", dueDate: dateParam(date) });
        setTitle("");
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      await toggleTaskStatus(id);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>Tasks and projects due this day.</DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nothing due yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 py-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: AREA_DOT_COLOR[item.area] }}
                  aria-hidden
                />
                {item.kind === "task" ? (
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    disabled={isPending}
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border",
                      item.done ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                    aria-label={item.done ? "Mark as not done" : "Mark as done"}
                  >
                    {item.done && <Check className="size-3" />}
                  </button>
                ) : (
                  <span className="size-5 shrink-0" />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "flex-1 truncate text-sm hover:underline",
                    item.done && "text-muted-foreground line-through",
                  )}
                >
                  {item.title}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.kind === "project" ? "Project" : AREA_LABEL[item.area]}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <Input
            placeholder="Add a task for this day..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Select value={area} onValueChange={(v) => setArea(v as Area)}>
            <SelectTrigger className="w-[110px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AREAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {AREA_LABEL[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={handleAdd} disabled={isPending || !title.trim()}>
            Add
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
