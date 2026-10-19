import { LoadingScreen } from "@/components/ui/loading-screen";

// Shown by React Suspense while a dashboard page's server data fetch is in
// flight (e.g. clicking between Tasks, Tenders, Habits...). The group layout
// itself (sidebar, auth check) isn't re-rendered on these navigations, so
// this only needs to cover the page content area — not a full-screen splash.
export default function DashboardLoading() {
  return <LoadingScreen fullscreen={false} className="py-24" />;
}
