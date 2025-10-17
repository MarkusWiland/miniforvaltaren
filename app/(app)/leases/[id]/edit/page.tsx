import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseEditForm } from "../../_components/lease-edit-form";
import { updateLeaseAction } from "../../../tenants/actions/action";

export default async function EditLeasePage({
  params,
}: {
  params: { id: string };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const lease = await prisma.lease.findFirst({
    where: { id: params.id, landlordId },
    include: { tenant: true, unit: { include: { property: true } } },
  });
  if (!lease) notFound();

  const properties = await prisma.property.findMany({
    where: { landlordId },
    select: {
      id: true,
      name: true,
      units: { select: { id: true, label: true } },
    },
    orderBy: { name: "asc" },
  });

  const tenants = await prisma.tenant.findMany({
    where: { landlordId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Redigera avtal</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaseEditForm
            action={updateLeaseAction}
            data={{
              leaseId: lease.id,
              properties,
              tenants,
              initial: {
                propertyId: lease.unit.propertyId,
                unitId: lease.unitId,
                tenantId: lease.tenantId,
                rentAmountKr: lease.rentAmount / 100,
                dueDay: lease.dueDay,
                startDate: lease.startDate.toISOString().slice(0, 10),
                endDate: lease.endDate
                  ? lease.endDate.toISOString().slice(0, 10)
                  : "",
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
