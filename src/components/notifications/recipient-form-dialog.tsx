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
import { Checkbox } from "@/components/ui/checkbox";
import { createRecipient } from "@/actions/notifications";

export function RecipientFormDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    const payload = {
      label: String(formData.get("label") || ""),
      email: String(formData.get("email") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      dailyDigest: formData.get("dailyDigest") === "on",
      weeklyDigest: formData.get("weeklyDigest") === "on",
    };

    if (!payload.email && !payload.whatsapp) {
      setError("Enter an email address or a WhatsApp number.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createRecipient(payload);
        setOpen(false);
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add recipient
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add recipient</DialogTitle>
          <DialogDescription>
            Fill in an email, a WhatsApp number, or both — this recipient gets notified on every channel filled in.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="label">
              Label
            </label>
            <Input id="label" name="label" placeholder="e.g. Me, Work phone" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="whatsapp">
              WhatsApp number
            </label>
            <Input id="whatsapp" name="whatsapp" placeholder="+15551234567" />
            <p className="text-xs text-muted-foreground">
              E.164 format. This number must first join your Twilio Sandbox before it can receive messages.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox name="dailyDigest" defaultChecked />
              <span className="text-sm text-foreground">Daily &quot;today&apos;s tasks&quot; digest</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox name="weeklyDigest" defaultChecked />
              <span className="text-sm text-foreground">Weekly summary</span>
            </label>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Add recipient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
