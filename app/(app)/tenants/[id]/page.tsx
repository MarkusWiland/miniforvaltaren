// app/(app)/tenants/[id]/page.tsx
export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { deleteTenantAction } from "../actions/action";

export default async function TenantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const tenant = await prisma.tenant.findFirst({
    where: { id: params.id, landlordId },
    include: {
      leases: {
        include: { unit: { include: { property: true } } },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!tenant) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {tenant.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tenant.email ?? "—"} {tenant.phone ? `• ${tenant.phone}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">

        <Button asChild variant="secondary">
          <Link href="/tenants">Tillbaka</Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Ta bort</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ta bort hyresgäst?</AlertDialogTitle>
              <AlertDialogDescription>
                Detta tar bort hyresgästen <strong>{tenant.name}</strong> och
                <br /> alla kopplade avtal, avier och betalningar. Åtgärden kan
                inte ångras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <form action={deleteTenantAction}>
                <input type="hidden" name="tenantId" value={tenant.id} />
                <AlertDialogAction
                  type="submit"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ja, ta bort
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
                  </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avtal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tenant.leases.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Inga avtal kopplade.
              <div className="mt-3">
                <Button asChild size="sm">
                  <Link href={`/leases/new?tenantId=${tenant.id}`}>
                    Skapa avtal
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">
                      Fastighet/Enhet
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Hyra/mån
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Förfallodag
                    </th>
                    <th className="px-4 py-2 text-left font-medium">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.leases.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-4 py-3">
                        {l.unit.property.name} • {l.unit.label}{" "}
                        {!l.endDate || new Date(l.endDate) > new Date() ? (
                          <Badge variant="secondary" className="ml-1">
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-1">
                            Avslutad
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">{formatSEK(l.rentAmount)}</td>
                      <td className="px-4 py-3">Dag {l.dueDay}</td>
                      <td className="px-4 py-3">
                        {formatSE(l.startDate)} –{" "}
                        {l.endDate ? formatSE(l.endDate) : "Tillsvidare"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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
