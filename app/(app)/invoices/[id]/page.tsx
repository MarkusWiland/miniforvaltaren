// app/(app)/invoices/[id]/page.tsx
export const runtime = "nodejs";

import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { markInvoicePaidAction } from "../actions/action";



function formatSE(date: Date) {
  return new Date(date).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function formatSEK(öre: number) {
  return (öre / 100).toLocaleString("sv-SE", {
    style: "currency",
    currency: "SEK",
  });
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const invoice = await prisma.rentInvoice.findFirst({
    where: { id: params.id, landlordId },
    include: {
      lease: {
        include: {
          tenant: true,
          unit: { include: { property: true } },
        },
      },
      payments: {
        orderBy: { paidDate: "desc" },
      },
    },
  });

  if (!invoice) notFound();

  const { lease } = invoice;
  const { tenant, unit } = lease;
  const property = unit.property;

  const isPaid = invoice.status === "PAID";
  const isOverdue = invoice.status === "OVERDUE";
  let badgeVariant: "default" | "secondary" | "outline" = "outline";
  if (isPaid) badgeVariant = "secondary";
  if (isOverdue) badgeVariant = "default";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Avi</h1>
          <p className="text-sm text-muted-foreground">
            {tenant.name} • {property.name} / {unit.label}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/invoices">Tillbaka</Link>
          </Button>

          {!isPaid && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>Markera som betald</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Markera avi som betald?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Detta sätter status till <strong>Betald</strong> och
                    registrerar en betalning på {formatSEK(invoice.amount)} med
                    dagens datum. Åtgärden kan ändras i efterhand genom att
                    redigera betalningar manuellt (byggs senare).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <form action={markInvoicePaidAction}>
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <AlertDialogAction type="submit">
                      Ja, markera betald
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Grundinfo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detaljer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Hyresgäst</div>
            <div className="font-medium">{tenant.name}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Fastighet/Enhet</div>
            <div className="font-medium">
              {property.name} • {unit.label}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Belopp</div>
            <div className="font-medium">{formatSEK(invoice.amount)}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Förfallodatum</div>
            <div className="font-medium">{formatSE(invoice.dueDate)}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <Badge variant={badgeVariant}>
              {isPaid ? "Betald" : isOverdue ? "Förfallen" : "Obetald"}
            </Badge>
          </div>

          {invoice.paidAt && (
            <div>
              <div className="text-sm text-muted-foreground">Betald</div>
              <div className="font-medium">{formatSE(invoice.paidAt)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Betalningar */}
      <Card>
        <CardHeader className="flex items-center justify-between space-y-0">
          <CardTitle className="text-base">Betalningar</CardTitle>
          {/* Här kan du senare lägga en “Lägg till betalning”-dialog för delbetalningar */}
        </CardHeader>
        <CardContent className="p-0">
          {invoice.payments.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Inga betalningar registrerade.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Datum</th>
                    <th className="px-4 py-2 text-right font-medium">Belopp</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3">{formatSE(p.paidDate)}</td>
                      <td className="px-4 py-3 text-right">
                        {formatSEK(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snabb-länkar */}
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={`/leases/${lease.id}`}>Visa avtal</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/tenants/${tenant.id}`}>Visa hyresgäst</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/properties/${property.id}`}>Visa fastighet</Link>
        </Button>
      </div>
    </div>
  );
}
