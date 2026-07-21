"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createHabit } from "@/actions/habits";
import { HABIT_FREQUENCIES } from "@/types";
import type { Area, HabitFrequency } from "@/types";

const FREQUENCY_LABEL: Record<HabitFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  CUSTOM: "Custom",
};

export function HabitFormDialog({ area }: { area: Area }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") || "");
    const frequency = String(formData.get("frequency") || "DAILY") as HabitFrequency;
    if (!name.trim()) return;

    startTransition(async () => {
      await createHabit({ name, area, frequency });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New habit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New habit</DialogTitle>
          <DialogDescription>
            Track something you want to do consistently.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Name
            </label>
            <Input id="name" name="name" placeholder="e.g. Gym session" required autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Frequency</label>
            <Select name="frequency" defaultValue="DAILY">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HABIT_FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FREQUENCY_LABEL[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Create habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
