import { Search } from "lucide-react";
import { getCurrentArea } from "@/lib/area";
import { AreaSwitcher } from "@/components/layout/area-switcher";

export async function Topbar() {
  const area = await getCurrentArea();

  return (
    <header className="flex items-center gap-4 px-4 md:px-0 py-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tasks, projects, notes..."
          className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
        />
      </div>
      <div className="ml-auto">
        <AreaSwitcher area={area} />
      </div>
    </header>
  );
}
