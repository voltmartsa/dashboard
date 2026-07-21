import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getCurrentArea } from "@/lib/area";
import { requireUser } from "@/lib/auth";

export default async function DashboardGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [area, user] = await Promise.all([getCurrentArea(), requireUser()]);

  return (
    <div
      data-area={area.toLowerCase()}
      className="mx-auto flex min-h-screen max-w-[1440px]"
    >
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col px-4 md:px-6 pb-24 md:pb-10">
        <Topbar />
        <main className="flex-1">{children}</main>
      </div>
      <MobileNav user={user} />
    </div>
  );
}
