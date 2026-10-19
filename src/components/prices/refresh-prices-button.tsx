"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshAllPrices } from "@/actions/prices";

export function RefreshPricesButton({ disabled }: { disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await refreshAllPrices();
      if (!result.ok) return setMessage(`Refresh failed: ${result.error}`);
      const parts = [`Checked ${result.checked} link${result.checked === 1 ? "" : "s"}`];
      if (result.failed) parts.push(`${result.failed} couldn't be read`);
      if (result.skipped) parts.push(`${result.skipped} left for the next run`);
      setMessage(parts.join(", ") + ".");
    });
  }

  return (
    <div className="flex items-center gap-2">
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
      <Button size="sm" variant="outline" onClick={handleClick} loading={isPending} disabled={disabled}>
        {!isPending && <RefreshCw className="size-3.5" />}
        {isPending ? "Checking..." : "Refresh prices"}
      </Button>
    </div>
  );
}
