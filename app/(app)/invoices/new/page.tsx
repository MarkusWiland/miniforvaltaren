// app/(app)/invoices/new/page.tsx
export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceForm } from "../_components/invoice-form";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: { leaseId?: string; err?: string | string[] };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  // Hämta aktiva avtal (eller alla – välj vad du vill)
  const leases = await prisma.lease.findMany({
    where: {
      landlordId,
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
    },
    orderBy: { startDate: "desc" },
    include: {
      tenant: true,
      unit: { include: { property: true } },
    },
    take: 200,
  });

  // Om leaseId är förvalt, hämta hyra som default amount
  let defaultAmountKr = 0;
  if (searchParams?.leaseId) {
    const selected = leases.find((l) => l.id === searchParams.leaseId);
    if (selected) defaultAmountKr = Math.round(selected.rentAmount / 100);
  }

  const serverError = Array.isArray(searchParams?.err)
    ? searchParams.err[0]
    : searchParams?.err;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Ny avi</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            data={{
              leases: leases.map((l) => ({
                id: l.id,
                label: `${l.tenant.name} • ${l.unit.property.name} / ${l.unit.label}`,
              })),
              initialLeaseId: searchParams?.leaseId,
              defaultAmountKr,
            }}
            serverError={serverError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
