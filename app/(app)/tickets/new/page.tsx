// app/(app)/tickets/new/page.tsx
export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketForm } from "../_components/ticket-form";
import { createTicketAction } from "../actions/action";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: { tenantId?: string; err?: string | string[] };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const tenants = await prisma.tenant.findMany({
    where: { landlordId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const serverError = Array.isArray(searchParams?.err)
    ? searchParams.err[0]
    : searchParams?.err;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nytt ärende</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketForm
            action={createTicketAction}
            data={{ tenants, initialTenantId: searchParams?.tenantId }}
            serverError={serverError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
