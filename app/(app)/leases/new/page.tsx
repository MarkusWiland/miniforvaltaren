// app/(app)/leases/new/page.tsx
export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaseForm } from "../_components/leases-form";
import { createLeaseAction } from "../actions/action";


export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: { propertyId?: string; unitId?: string; tenantId?: string; err?: string | string[] };
}) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

  // Hämta properties med units (för select)
  const properties = await prisma.property.findMany({
    where: { landlordId },
    select: {
      id: true,
      name: true,
      units: { select: { id: true, label: true } },
    },
    orderBy: { name: "asc" },
  });

  // Hämta tenants
  const tenants = await prisma.tenant.findMany({
    where: { landlordId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const serverError = Array.isArray(searchParams?.err) ? searchParams.err[0] : searchParams?.err;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nytt avtal</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaseForm
            action={createLeaseAction}
            data={{
              properties,
              tenants,
              // Prefill från query (frivilligt)
              initialPropertyId: searchParams?.propertyId,
              initialUnitId: searchParams?.unitId,
              initialTenantId: searchParams?.tenantId,
            }}
            serverError={serverError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
