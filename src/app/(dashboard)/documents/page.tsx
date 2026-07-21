import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentFormDialog } from "@/components/documents/document-form-dialog";
import { DocumentRow } from "@/components/documents/document-row";
import { getCurrentArea } from "@/lib/area";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExpiryStatus } from "@/lib/documents";

const STATUS_RANK = { expired: 0, expiring: 1, none: 2, valid: 3 };

export default async function DocumentsPage() {
  const [area, user] = await Promise.all([getCurrentArea(), requireUser()]);

  const documents = await prisma.document.findMany({
    where: { area, ownerId: user.id },
    orderBy: { name: "asc" },
  });

  const sorted = [...documents].sort((a, b) => {
    const rankDiff = STATUS_RANK[getExpiryStatus(a.expiryDate)] - STATUS_RANK[getExpiryStatus(b.expiryDate)];
    if (rankDiff !== 0) return rankDiff;
    return (a.expiryDate?.getTime() ?? Infinity) - (b.expiryDate?.getTime() ?? Infinity);
  });

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="Licenses, passports, and anything else with an expiry date to track."
        actions={<DocumentFormDialog area={area} />}
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description={`Add a ${area === "BUSINESS" ? "business" : "personal"} document like a license, passport, or insurance policy to keep its expiry date in view.`}
          action={<DocumentFormDialog area={area} />}
        />
      ) : (
        <Card className="p-2">
          <div className="flex flex-col divide-y divide-border">
            {sorted.map((document) => (
              <DocumentRow key={document.id} document={document} area={area} />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
