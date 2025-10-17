// app/(app)/tickets/[id]/page.tsx
export const runtime = "nodejs";

import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteTicketAction, updateTicketStatusAction } from "../actions/action";



function formatSE(date: Date) {
  return new Date(date).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, landlordId },
    include: { tenant: true },
  });

  if (!ticket) notFound();

  const statusBadge =
    ticket.status === "OPEN"
      ? { label: "Öppen", variant: "default" as const }
      : ticket.status === "IN_PROGRESS"
      ? { label: "Pågår", variant: "secondary" as const }
      : { label: "Avslutad", variant: "outline" as const };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ärende</h1>
          <p className="text-sm text-muted-foreground">
            {ticket.tenant ? ticket.tenant.name : "Ingen hyresgäst kopplad"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><Link href="/tickets">Tillbaka</Link></Button>
          <Button asChild><Link href={`/tickets/${ticket.id}/edit`}>Redigera</Link></Button>

          {/* Ta bort */}
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive">Ta bort</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ta bort ärende?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta tar bort ärendet permanent. Åtgärden kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <form action={deleteTicketAction}>
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <AlertDialogAction type="submit" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Ja, ta bort
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detaljer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Titel</div>
            <div className="font-medium">{ticket.title}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Skapad</div>
            <div className="font-medium">{formatSE(ticket.createdAt)}</div>
          </div>
          {ticket.description ? (
            <div className="sm:col-span-2">
              <div className="text-sm text-muted-foreground">Beskrivning</div>
              <div className="whitespace-pre-wrap">{ticket.description}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Snabbstatus: ändra status */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ändra status</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <form action={updateTicketStatusAction}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <input type="hidden" name="status" value="OPEN" />
            <Button type="submit" variant={ticket.status === "OPEN" ? "default" : "outline"}>Öppen</Button>
          </form>
          <form action={updateTicketStatusAction}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <input type="hidden" name="status" value="IN_PROGRESS" />
            <Button type="submit" variant={ticket.status === "IN_PROGRESS" ? "default" : "outline"}>Pågår</Button>
          </form>
          <form action={updateTicketStatusAction}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <input type="hidden" name="status" value="CLOSED" />
            <Button type="submit" variant={ticket.status === "CLOSED" ? "default" : "outline"}>Avslutad</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
