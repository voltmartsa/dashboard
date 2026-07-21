import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { UserRow } from "@/components/admin/user-row";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const admin = await requireSuperAdmin();

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Manage user accounts across Squash."
      />

      <Card className="p-2">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          {users.length} account{users.length === 1 ? "" : "s"}
        </div>
        <div className="flex flex-col divide-y divide-border">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as "SUPER_ADMIN" | "USER",
                active: user.active,
                createdAt: user.createdAt,
                isSelf: user.id === admin.id,
              }}
            />
          ))}
        </div>
      </Card>
    </>
  );
}
