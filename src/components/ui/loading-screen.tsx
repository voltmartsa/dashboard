import { LogoMark } from "@/components/icons/logo-mark";
import { cn } from "@/lib/utils";

// The app's branded loading state — used as route `loading.tsx` fallbacks
// (shown while a page's server data fetch is in flight) and anywhere else a
// section needs more than a bare spinner. The mark does a squash-and-stretch
// bounce (see .loading-mark / .loading-shadow in globals.css); disabled
// automatically for prefers-reduced-motion.
export function LoadingScreen({
  label = "Loading…",
  fullscreen = true,
  className,
}: {
  label?: string;
  fullscreen?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullscreen && "min-h-[70vh]",
        className,
      )}
    >
      <div className="flex flex-col items-center">
        <div className="loading-mark flex size-14 items-center justify-center rounded-2xl bg-accent-dark text-white shadow-lg shadow-black/10">
          <LogoMark className="size-7" />
        </div>
        <div className="loading-shadow mt-2.5 h-2 w-9 rounded-full bg-black/15 blur-[1px]" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
