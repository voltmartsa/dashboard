import { Bell } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RecipientFormDialog } from "@/components/notifications/recipient-form-dialog";
import { RecipientRow } from "@/components/notifications/recipient-row";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  const user = await requireUser();
  const recipients = await prisma.notificationRecipient.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Get today's tasks and a weekly summary by email or WhatsApp."
        actions={<RecipientFormDialog />}
      />

      {recipients.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No recipients yet"
          description="Add an email address or WhatsApp number to start receiving digests."
          action={<RecipientFormDialog />}
        />
      ) : (
        <Card>
          <div className="flex flex-col gap-3">
            {recipients.map((recipient) => (
              <RecipientRow key={recipient.id} recipient={recipient} />
            ))}
          </div>
        </Card>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Digests are sent by a scheduled job, not by this page — see the &quot;Deploying to
        cPanel&quot; section of the README for how to wire up the daily/weekly Cron Jobs once
        this is hosted.
      </p>
    </>
  );
}
