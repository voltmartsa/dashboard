import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getCurrentArea } from "@/lib/area";

export default async function DashboardGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const area = await getCurrentArea();

  return (
    <div
      data-area={area.toLowerCase()}
      className="mx-auto flex min-h-screen max-w-[1440px]"
    >
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col px-4 md:px-6 pb-10">
        <Topbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
