import { storeName } from "@/lib/prices/stores";

// Shared by the Prices page and the morning email so both agree on who's cheapest.

export type LinkData = {
  id: string;
  url: string;
  isMine: boolean;
  price: number | null;
  regularPrice: number | null;
  title: string | null;
  inStock: boolean | null;
  error: string | null;
  checkedAt: Date | string | null;
  history: { day: string; price: number }[];
};

export type ItemData = { id: string; name: string; links: LinkData[] };

export type ItemAnalysis = {
  name: string;
  mine: LinkData | null;
  myPrice: number | null;
  competitors: (LinkData & { store: string })[];
  cheapest: (LinkData & { store: string }) | null;
  state: "dearer" | "cheapest" | "unknown";
  // How much more you charge than the cheapest competitor, as a fraction of your price.
  gap: number | null;
  errors: number;
};

export function analyseItem(item: ItemData): ItemAnalysis {
  const mine = item.links.find((l) => l.isMine) ?? null;
  const myPrice = mine?.price ?? null;
  const competitors = item.links.filter((l) => !l.isMine).map((l) => ({ ...l, store: storeName(l.url) }));
  const priced = competitors.filter((c) => c.price != null);
  const cheapest = priced.reduce<(typeof priced)[number] | null>((a, c) => (!a || c.price! < a.price! ? c : a), null);

  let state: ItemAnalysis["state"] = "unknown";
  if (myPrice != null && cheapest) state = cheapest.price! < myPrice - 0.005 ? "dearer" : "cheapest";

  return {
    name: item.name || mine?.title || mine?.url || "Untitled product",
    mine,
    myPrice,
    competitors,
    cheapest,
    state,
    gap: state === "dearer" && myPrice ? (myPrice - cheapest!.price!) / myPrice : null,
    errors: item.links.filter((l) => l.error).length,
  };
}

export function formatRand(n: number | null | undefined) {
  if (n == null) return "–";
  return "R" + n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
