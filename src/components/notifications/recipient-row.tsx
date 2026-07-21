"use client";

import { useState, useTransition } from "react";
import { Mail, MessageCircle, Trash2, Send } from "lucide-react";
import { toggleRecipientField, deleteRecipient, sendTestNotification } from "@/actions/notifications";
import { cn } from "@/lib/utils";

export type RecipientRowData = {
  id: string;
  label: string | null;
  email: string | null;
  whatsapp: string | null;
  dailyDigest: boolean;
  weeklyDigest: boolean;
};

export function RecipientRow({ recipient }: { recipient: RecipientRowData }) {
  const [isPending, startTransition] = useTransition();
  const [testStatus, setTestStatus] = useState<string | null>(null);

  function handleTest() {
    setTestStatus("Sending...");
    startTransition(async () => {
      const result = await sendTestNotification(recipient.id);
      setTestStatus(result.ok ? "Sent!" : `Failed: ${result.error}`);
      setTimeout(() => setTestStatus(null), 6000);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {recipient.label || "Untitled recipient"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {recipient.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3" />
              {recipient.email}
            </span>
          )}
          {recipient.whatsapp && (
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3" />
              {recipient.whatsapp}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <ToggleChip
          label="Daily"
          active={recipient.dailyDigest}
          onClick={() =>
            startTransition(() => toggleRecipientField(recipient.id, "dailyDigest"))
          }
        />
        <ToggleChip
          label="Weekly"
          active={recipient.weeklyDigest}
          onClick={() =>
            startTransition(() => toggleRecipientField(recipient.id, "weeklyDigest"))
          }
        />

        <button
          type="button"
          onClick={handleTest}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 h-8 rounded-full border border-border px-3 text-xs font-medium hover:bg-black/[0.03] cursor-pointer disabled:opacity-50"
        >
          <Send className="size-3" />
          Send test
        </button>

        <button
          type="button"
          onClick={() => startTransition(() => deleteRecipient(recipient.id))}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer"
          aria-label="Delete recipient"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {testStatus && (
        <p className="text-xs text-muted-foreground sm:basis-full">{testStatus}</p>
      )}
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-3 text-xs font-medium cursor-pointer transition-colors",
        active
          ? "bg-primary-soft text-primary"
          : "bg-black/[0.05] text-muted-foreground hover:bg-black/[0.09]",
      )}
    >
      {label}
    </button>
  );
}
