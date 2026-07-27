"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendTestPush } from "@/actions/push";

export function SendTestPushButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function handleTest() {
    setStatus("Sending...");
    startTransition(async () => {
      const result = await sendTestPush();
      setStatus(result.ok ? "Sent!" : `Failed: ${result.error}`);
      setTimeout(() => setStatus(null), 6000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleTest}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 h-8 rounded-full border border-border px-3 text-xs font-medium hover:bg-black/[0.03] cursor-pointer disabled:opacity-50"
      >
        <Send className="size-3" />
        Send test push
      </button>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
