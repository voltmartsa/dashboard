"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runTenderScrapeNow } from "@/actions/tenders";

export function RunScrapeNowButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await runTenderScrapeNow();
        setMessage(
          `Scraped ${result.scraped} tenders, ${result.newTenders} new, ${result.matchesCreated} new matches.`,
        );
      } catch {
        setMessage("Scrape failed. Try again shortly.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={handleClick} disabled={isPending}>
        <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Scraping..." : "Scrape now"}
      </Button>
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  );
}
