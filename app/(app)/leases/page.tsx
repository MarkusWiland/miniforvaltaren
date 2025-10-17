

import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default async function LeasesPage({
  searchParams,
}: {
  searchParams: { propertyId?: string; status?: "active" | "ended" };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const where: any = { landlordId };
  if (searchParams?.propertyId) {
    where.unit = { propertyId: searchParams.propertyId };
  }
  if (searchParams?.status === "active") {
    where.OR = [{ endDate: null }, { endDate: { gt: new Date() } }];
  } else if (searchParams?.status === "ended") {
    where.endDate = { lte: new Date() };
  }

  const [leases, properties] = await Promise.all([
    prisma.lease.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: { tenant: true, unit: { include: { property: true } } },
      take: 50,
    }),
    prisma.property.findMany({
      where: { landlordId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Avtal</h1>
          <p className="text-sm text-muted-foreground">
            Hantera alla avtal. Filtrera per fastighet/status.
          </p>
        </div>
        <Button asChild>
          <Link href="/leases/new">Nytt avtal</Link>
        </Button>
      </div>

      {/* Filter (enkel, länkbaserad) */}
      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          <Button
            asChild
            size="sm"
            variant={!searchParams?.propertyId ? "default" : "outline"}
          >
            <Link
              href={`/leases${
                searchParams?.status ? `?status=${searchParams.status}` : ""
              }`}
            >
              Alla fastigheter
            </Link>
          </Button>
          {properties.map((p) => (
            <Button
              key={p.id}
              asChild
              size="sm"
              variant={searchParams?.propertyId === p.id ? "default" : "outline"}
            >
              <Link
                href={`/leases?propertyId=${p.id}${
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
              variant={searchParams?.status === "active" ? "default" : "outline"}
            >
              <Link
                href={`/leases?${new URLSearchParams({
                  ...(searchParams?.propertyId
                    ? { propertyId: searchParams.propertyId }
                    : {}),
                  status: "active",
                }).toString()}`}
              >
                Aktiva
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={searchParams?.status === "ended" ? "default" : "outline"}
            >
              <Link
                href={`/leases?${new URLSearchParams({
                  ...(searchParams?.propertyId
                    ? { propertyId: searchParams.propertyId }
                    : {}),
                  status: "ended",
                }).toString()}`}
              >
                Avslutade
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Avtal ({leases.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leases.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Inga avtal hittades.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Hyresgäst</th>
                    <th className="px-4 py-2 text-left font-medium">
                      Fastighet/Enhet
                    </th>
                    <th className="px-4 py-2 text-left font-medium">Hyra/mån</th>
                    <th className="px-4 py-2 text-left font-medium">Förfallodag</th>
                    <th className="px-4 py-2 text-left font-medium">Period</th>
                    <th className="px-4 py-2 text-right font-medium">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {leases.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{l.tenant.name}</span>
                          {!l.endDate || new Date(l.endDate) > new Date() ? (
                            <Badge variant="secondary">Aktiv</Badge>
                          ) : (
                            <Badge variant="outline">Avslutad</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {l.unit.property.name} • {l.unit.label}
                      </td>
                      <td className="px-4 py-3">{formatSEK(l.rentAmount)}</td>
                      <td className="px-4 py-3">Dag {l.dueDay}</td>
                      <td className="px-4 py-3">
                        {formatSE(l.startDate)} –{" "}
                        {l.endDate ? formatSE(l.endDate) : "Tillsvidare"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/leases/${l.id}`}>Öppna</Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/leases/${l.id}/edit`}>Redigera</Link>
                          </Button>
                        </div>
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
