// app/(app)/tickets/[id]/edit/page.tsx
export const runtime = "nodejs";

import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketForm } from "../../_components/ticket-form";
import { updateTicketAction } from "../../actions/action";


export default async function EditTicketPage({ params, searchParams }: { params: { id: string }, searchParams: { err?: string | string[] } }) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

  const [ticket, tenants] = await Promise.all([
    prisma.ticket.findFirst({ where: { id: params.id, landlordId } }),
    prisma.tenant.findMany({ where: { landlordId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!ticket) notFound();

  const serverError = Array.isArray(searchParams?.err) ? searchParams.err[0] : searchParams?.err;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Redigera ärende</CardTitle></CardHeader>
        <CardContent>
          <TicketForm
            action={updateTicketAction}
            data={{ tenants }}
            serverError={serverError}
            initial={{
              ticketId: ticket.id,
              title: ticket.title,
              description: ticket.description ?? "",
              tenantId: ticket.tenantId ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
