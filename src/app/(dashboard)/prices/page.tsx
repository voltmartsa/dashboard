import { Tags, TrendingDown, Trophy, Percent } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PricesTable } from "@/components/prices/prices-table";
import { PriceItemFormDialog } from "@/components/prices/price-item-form-dialog";
import { RefreshPricesButton } from "@/components/prices/refresh-prices-button";
import { requireUser } from "@/lib/auth";
import { loadPriceItems } from "@/lib/prices/report";
import { analyseItem } from "@/lib/prices/analyse";

// Adding/editing a product and "Refresh prices" check competitor sites from a
// Server Action rendered on this page, so it needs the same budget as the cron.
export const maxDuration = 60;

export default async function PricesPage() {
  const user = await requireUser();
  const items = await loadPriceItems(user.id);
  const analysed = items.map(analyseItem);
  const dearer = analysed.filter((a) => a.state === "dearer");
  const avgGap = dearer.length ? Math.round((dearer.reduce((s, a) => s + a.gap!, 0) / dearer.length) * 100) : null;

  const lastChecked = items
    .flatMap((i) => i.links.map((l) => l.checkedAt))
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <>
      <PageHeader
        title="Prices"
        subtitle={
          lastChecked
            ? `Your prices against competitors. Last checked ${lastChecked.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" })}.`
            : "Your prices against competitors, checked every morning."
        }
        actions={
          <div className="flex items-center gap-2">
            <RefreshPricesButton disabled={items.length === 0} />
            <PriceItemFormDialog />
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No products yet"
          description="Add a product with a link to your own page and the same product on competitor sites to start comparing prices."
          action={<PriceItemFormDialog />}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Products tracked" value={items.length} icon={Tags} tone="primary" />
            <StatCard label="You're cheapest" value={analysed.filter((a) => a.state === "cheapest").length} icon={Trophy} />
            <StatCard label="Competitor cheaper" value={dearer.length} icon={TrendingDown} tone="danger" />
            <StatCard label="Avg. amount you're over" value={avgGap == null ? "–" : `${avgGap}%`} icon={Percent} />
          </div>
          <PricesTable items={items} />
        </div>
      )}
    </>
  );
}
