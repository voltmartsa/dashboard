"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
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
import { createPriceItem, previewPriceLink, updatePriceItem } from "@/actions/prices";
import { formatRand } from "@/lib/prices/analyse";
import { cn } from "@/lib/utils";

type Preview = { state: "idle" } | { state: "loading" } | { state: "ok"; text: string } | { state: "error"; text: string };

export type PriceItemFormItem = { id: string; name: string; mine: string; competitors: string[] };

function PreviewLine({ preview }: { preview: Preview }) {
  if (preview.state === "idle") return null;
  return (
    <p
      className={cn(
        "text-xs",
        preview.state === "loading" && "text-muted-foreground",
        preview.state === "ok" && "text-emerald-700",
        preview.state === "error" && "text-danger",
      )}
    >
      {preview.state === "loading" ? "Checking price..." : preview.text}
    </p>
  );
}

export function PriceItemFormDialog({ item, trigger }: { item?: PriceItemFormItem; trigger?: React.ReactNode }) {
  const isEdit = Boolean(item);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(item?.name ?? "");
  const [mine, setMine] = useState(item?.mine ?? "");
  const [competitors, setCompetitors] = useState<string[]>(item?.competitors.length ? item.competitors : [""]);
  const [previews, setPreviews] = useState<Record<string, Preview>>({});

  function reset() {
    setName(item?.name ?? "");
    setMine(item?.mine ?? "");
    setCompetitors(item?.competitors.length ? item.competitors : [""]);
    setPreviews({});
    setError(null);
  }

  async function check(key: string, url: string, fillName = false) {
    if (!url.trim()) return setPreviews((p) => ({ ...p, [key]: { state: "idle" } }));
    setPreviews((p) => ({ ...p, [key]: { state: "loading" } }));
    const r = await previewPriceLink(url.trim());
    setPreviews((p) => ({
      ...p,
      [key]: r.ok
        ? { state: "ok", text: `${r.store}: ${r.title} — ${formatRand(r.price)}${r.inStock === false ? " (out of stock)" : ""}` }
        : { state: "error", text: `Couldn't read a price: ${r.error}` },
    }));
    if (r.ok && fillName) setName((n) => n || r.title);
  }

  function handleSubmit() {
    const payload = { name, mine, competitors: competitors.filter((c) => c.trim()) };
    setError(null);
    startTransition(async () => {
      const result = isEdit && item ? await updatePriceItem(item.id, payload) : await createPriceItem(payload);
      if (!result.ok) return setError(result.error);
      setOpen(false);
      if (!isEdit) reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Add product
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            Paste the link to your product and the same product on competitor sites. Prices are checked every
            morning.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="mine">
              Your product link
            </label>
            <Input
              id="mine"
              type="url"
              placeholder="https://voltmart.co.za/product/..."
              value={mine}
              onChange={(e) => setMine(e.target.value)}
              onBlur={() => check("mine", mine, true)}
              required
              autoFocus
            />
            <PreviewLine preview={previews.mine ?? { state: "idle" }} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="name">
              Name
            </label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Filled in from your product" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Competitor links</span>
            {competitors.map((c, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="url"
                    placeholder="https://ledtronix.co.za/..."
                    value={c}
                    onChange={(e) => setCompetitors((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                    onBlur={() => check(`c${i}`, c)}
                  />
                  <button
                    type="button"
                    onClick={() => setCompetitors((list) => (list.length === 1 ? [""] : list.filter((_, j) => j !== i)))}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-black/[0.05] hover:text-foreground cursor-pointer"
                    aria-label="Remove competitor link"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <PreviewLine preview={previews[`c${i}`] ?? { state: "idle" }} />
              </div>
            ))}
            <div>
              <Button type="button" size="sm" variant="outline" onClick={() => setCompetitors((l) => [...l, ""])}>
                <Plus className="size-3.5" />
                Another competitor
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isPending ? "Checking prices..." : isEdit ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
