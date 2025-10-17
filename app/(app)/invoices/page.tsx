// app/(app)/invoices/page.tsx
export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: { status?: string; propertyId?: string };
}) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

  const where: any = { landlordId };

  // Filtrering per status
  if (searchParams?.status) {
    where.status = searchParams.status.toUpperCase();
  }

  // Filtrering per fastighet
  if (searchParams?.propertyId) {
    where.lease = { unit: { propertyId: searchParams.propertyId } };
  }

  const [invoices, properties] = await Promise.all([
    prisma.rentInvoice.findMany({
      where,
      orderBy: { dueDate: "desc" },
      include: {
        lease: {
          include: {
            tenant: true,
            unit: { include: { property: true } },
          },
        },
      },
      take: 100,
    }),
    prisma.property.findMany({
      where: { landlordId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Avier</h1>
          <p className="text-sm text-muted-foreground">
            Hantera och filtrera avier per status eller fastighet.
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">Skapa nytt avtal</Link>
        </Button>

        
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          {/* Alla fastigheter */}
          <Button
            asChild
            size="sm"
            variant={!searchParams?.propertyId ? "default" : "outline"}
          >
            <Link
              href={`/invoices${
                searchParams?.status ? `?status=${searchParams.status}` : ""
              }`}
            >
              Alla fastigheter
            </Link>
          </Button>

          {/* Fastigheter */}
          {properties.map((p) => (
            <Button
              key={p.id}
              asChild
              size="sm"
              variant={searchParams?.propertyId === p.id ? "default" : "outline"}
            >
              <Link
                href={`/invoices?propertyId=${p.id}${
                  searchParams?.status ? `&status=${searchParams.status}` : ""
                }`}
              >
                {p.name}
              </Link>
            </Button>
          ))}

          <div className="ml-auto flex gap-2">
            <Button
              asChild
              size="sm"
              variant={!searchParams?.status ? "default" : "outline"}
            >
              <Link href="/invoices">Alla</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={searchParams?.status === "pending" ? "default" : "outline"}
            >
              <Link
                href={`/invoices?status=pending${
                  searchParams?.propertyId
                    ? `&propertyId=${searchParams.propertyId}`
                    : ""
                }`}
              >
                Obetalda
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={searchParams?.status === "paid" ? "default" : "outline"}
            >
              <Link
                href={`/invoices?status=paid${
                  searchParams?.propertyId
                    ? `&propertyId=${searchParams.propertyId}`
                    : ""
                }`}
              >
                Betalda
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={searchParams?.status === "overdue" ? "default" : "outline"}
            >
              <Link
                href={`/invoices?status=overdue${
                  searchParams?.propertyId
                    ? `&propertyId=${searchParams.propertyId}`
                    : ""
                }`}
              >
                Förfallna
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Avier ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Inga avier hittades.
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Hyresgäst</th>
                    <th className="px-4 py-2 text-left font-medium">Fastighet/Enhet</th>
                    <th className="px-4 py-2 text-left font-medium">Förfallodatum</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-right font-medium">Belopp</th>
                    <th className="px-4 py-2 text-right font-medium">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const { lease } = inv;
                    const { tenant, unit } = lease;
                    const property = unit.property;

                    let badgeVariant: "default" | "secondary" | "outline" = "outline";
                    if (inv.status === "PAID") badgeVariant = "secondary";
                    if (inv.status === "OVERDUE") badgeVariant = "default";

                    return (
                      <tr key={inv.id} className="border-t">
                        <td className="px-4 py-3">{tenant.name}</td>
                        <td className="px-4 py-3">
                          {property.name} • {unit.label}
                        </td>
                        <td className="px-4 py-3">
                          {formatSE(inv.dueDate)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={badgeVariant}>
                            {inv.status === "PAID"
                              ? "Betald"
                              : inv.status === "OVERDUE"
                              ? "Förfallen"
                              : "Obetald"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">{formatSEK(inv.amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/invoices/${inv.id}`}>Öppna</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
