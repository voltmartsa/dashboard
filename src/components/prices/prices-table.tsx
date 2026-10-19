"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PriceItemFormDialog } from "@/components/prices/price-item-form-dialog";
import { deletePriceItem, refreshPriceItem } from "@/actions/prices";
import { analyseItem, formatRand, type ItemData, type LinkData } from "@/lib/prices/analyse";
import { STORE_ORDER } from "@/lib/prices/stores";
import { cn } from "@/lib/utils";

type Filter = "all" | "dearer" | "cheapest" | "errors";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "dearer", label: "Competitor cheaper" },
  { key: "cheapest", label: "I'm cheapest" },
  { key: "errors", label: "Problems" },
];

function Sparkline({ history }: { history: LinkData["history"] }) {
  if (history.length < 2) return null;
  const vals = history.map((h) => h.price);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const w = 56;
  const h = 14;
  const points = vals
    .map((v, i) => `${(i / (vals.length - 1)) * w},${max === min ? h / 2 : h - ((v - min) / (max - min)) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`-1 -1 ${w + 2} ${h + 2}`} className="ml-auto mt-1 block text-muted-foreground" aria-label="Price trend">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function PriceCell({ link }: { link: LinkData }) {
  if (link.price == null && !link.error) return <span className="text-muted-foreground">Checking…</span>;
  if (link.price == null)
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.error ?? ""} className="text-xs text-warning hover:underline">
        Couldn&apos;t read price
      </a>
    );

  return (
    <div className="flex flex-col items-end gap-1">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-semibold whitespace-nowrap hover:underline">
        {formatRand(link.price)}
      </a>
      {link.inStock === false && <span className="text-[11px] text-warning">Out of stock</span>}
      {link.error && <span className="text-[11px] text-warning" title={link.error}>Last check failed</span>}
      <Sparkline history={link.history} />
    </div>
  );
}

function RowActions({ item, mine, competitors }: { item: ItemData; mine: string; competitors: string[] }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => startTransition(() => refreshPriceItem(item.id))}
        disabled={isPending}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-black/[0.05] hover:text-foreground cursor-pointer disabled:opacity-50"
        aria-label="Check prices now"
      >
        <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
      </button>
      <PriceItemFormDialog
        item={{ id: item.id, name: item.name, costPrice: item.costPrice, mine, competitors }}
        trigger={
          <button type="button" className="rounded-lg p-1.5 text-muted-foreground hover:bg-black/[0.05] hover:text-foreground cursor-pointer" aria-label="Edit product">
            <Pencil className="size-3.5" />
          </button>
        }
      />
      <button
        type="button"
        onClick={() => {
          if (confirm(`Stop tracking “${item.name || "this product"}”?`)) startTransition(() => deletePriceItem(item.id));
        }}
        disabled={isPending}
        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-danger cursor-pointer disabled:opacity-50"
        aria-label="Remove product"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export function PricesTable({ items }: { items: ItemData[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => items.map((item) => ({ item, a: analyseItem(item) })), [items]);

  const stores = useMemo(() => {
    const set = new Set(rows.flatMap((r) => r.a.competitors.map((c) => c.store)));
    const rank = (s: string) => (STORE_ORDER.includes(s) ? STORE_ORDER.indexOf(s) : 99);
    return [...set].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }, [rows]);

  const shown = rows
    .filter(({ a }) => {
      if (query && !a.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === "dearer") return a.state === "dearer";
      if (filter === "cheapest") return a.state === "cheapest";
      if (filter === "errors") return a.errors > 0;
      return true;
    })
    .sort((x, y) => (y.a.gap ?? -1) - (x.a.gap ?? -1));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "h-8 rounded-full px-3.5 text-xs font-medium cursor-pointer transition-colors",
              filter === f.key ? "bg-accent-dark text-white" : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
        <Input
          className="w-full sm:ml-auto sm:w-64"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] bg-card shadow-[0_2px_10px_rgba(28,26,22,0.05)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 text-right font-medium">Cost</th>
              <th className="px-4 py-3 text-right font-medium">You</th>
              {stores.map((s) => (
                <th key={s} className="px-4 py-3 text-right font-medium">
                  {s}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={stores.length + 5} className="px-4 py-10 text-center text-muted-foreground">
                  Nothing matches this filter.
                </td>
              </tr>
            )}
            {shown.map(({ item, a }) => (
              <tr key={item.id} className="border-b border-border/60 last:border-0 align-top">
                <td className="px-4 py-3">
                  <a href={a.mine?.url} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">
                    {a.name}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {a.competitors.length} competitor link{a.competitors.length === 1 ? "" : "s"}
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                  {item.costPrice != null ? formatRand(item.costPrice) : <span className="font-normal text-muted-foreground">–</span>}
                </td>
                <td className="px-4 py-3 text-right">{a.mine ? <PriceCell link={a.mine} /> : "–"}</td>
                {stores.map((s) => {
                  const links = a.competitors.filter((c) => c.store === s);
                  return (
                    <td key={s} className="px-4 py-3 text-right">
                      {links.length === 0 ? (
                        <span className="text-muted-foreground">–</span>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {links.map((l) => (
                            <PriceCell key={l.id} link={l} />
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3">
                  {a.state === "dearer" ? (
                    <Badge className="bg-red-50 text-danger whitespace-nowrap">
                      {a.cheapest!.store} is {formatRand(a.myPrice! - a.cheapest!.price!)} cheaper
                    </Badge>
                  ) : a.state === "cheapest" ? (
                    <Badge className="bg-emerald-100 text-emerald-700 whitespace-nowrap">You&apos;re cheapest</Badge>
                  ) : (
                    <Badge className="bg-black/[0.05] text-muted-foreground whitespace-nowrap">Waiting for prices</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <RowActions item={item} mine={a.mine?.url ?? ""} competitors={a.competitors.map((c) => c.url)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Prices are checked every morning.
      </p>
    </div>
  );
}
