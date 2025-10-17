// app/(app)/units/page.tsx
export const runtime = "nodejs";

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

export default async function UnitsPage({
  searchParams,
}: {
  searchParams?: { propertyId?: string; q?: string };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const q = (searchParams?.q ?? "").trim();
  const propertyId = searchParams?.propertyId || "";

  // Filtrering
  const whereUnit: any = {
    property: { landlordId },
  };
  if (propertyId) whereUnit.propertyId = propertyId;
  if (q) whereUnit.label = { contains: q, mode: "insensitive" };

  const now = new Date();

  const [units, properties, counts] = await Promise.all([
    prisma.unit.findMany({
      where: whereUnit,
      orderBy: [
        { property: { name: "asc" } },
        { label: "asc" },
      ],
      include: {
        property: true,
        // Hämta ev. aktivt avtal (senaste som är aktivt)
        leases: {
          where: {
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gt: now } }],
          },
          include: { tenant: true },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
      take: 200,
    }),
    prisma.property.findMany({
      where: { landlordId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.unit.count({ where: { property: { landlordId } } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enheter</h1>
          <p className="text-sm text-muted-foreground">
            {counts} totalt • Filtrera per fastighet eller sök på enhetslabel.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/properties/new">Ny fastighet</Link>
          </Button>
          <Button asChild>
            <Link href="/units/new">Ny enhet</Link>
          </Button>
        </div>
      </div>

      {/* Filter + sök */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              variant={!propertyId ? "default" : "outline"}
            >
              <Link href={`/units${q ? `?q=${encodeURIComponent(q)}` : ""}`}>
                Alla fastigheter
              </Link>
            </Button>
            {properties.map((p) => (
              <Button
                key={p.id}
                asChild
                size="sm"
                variant={propertyId === p.id ? "default" : "outline"}
              >
                <Link
                  href={`/units?propertyId=${p.id}${
                    q ? `&q=${encodeURIComponent(q)}` : ""
                  }`}
                >
                  {p.name}
                </Link>
              </Button>
            ))}
          </div>

          <form
            className="ml-auto flex w-full gap-2 sm:w-auto"
            action="/units"
            method="get"
          >
            {propertyId ? (
              <input type="hidden" name="propertyId" value={propertyId} />
            ) : null}
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-[280px]"
              name="q"
              placeholder="Sök på label (t.ex. A-101)…"
              defaultValue={q}
            />
            <Button type="submit" size="sm" variant="secondary">
              Sök
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Enheter ({units.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {units.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Inga enheter hittades.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Label</th>
                    <th className="px-4 py-2 text-left font-medium">
                      Fastighet
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Aktivt avtal
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Hyresgäst
                    </th>
                    <th className="px-4 py-2 text-left font-medium">Period</th>
                    <th className="px-4 py-2 text-right font-medium">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => {
                    const active = u.leases[0] ?? null;
                    return (
                      <tr key={u.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{u.label}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/properties/${u.propertyId}`}
                            className="hover:underline"
                          >
                            {u.property.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {active ? (
                            <Badge variant="secondary">Aktiv</Badge>
                          ) : (
                            <Badge variant="outline">Ingen</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {active ? (
                            <Link
                              href={`/tenants/${active.tenantId}`}
                              className="hover:underline"
                            >
                              {active.tenant.name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {active ? (
                            <>
                              {formatSE(active.startDate)} –{" "}
                              {active.endDate
                                ? formatSE(active.endDate)
                                : "Tillsvidare"}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            {/* Skapa avtal för just denna enhet */}
                            <Button asChild size="sm" variant="ghost">
                              <Link
                                href={`/leases/new?propertyId=${u.propertyId}&unitId=${u.id}`}
                              >
                                Nytt avtal
                              </Link>
                            </Button>
                            {/* Redigera enhet (om du lägger till edit-sida senare) */}
                            {/* <Button asChild size="sm" variant="ghost">
                              <Link href={`/units/${u.id}/edit`}>Redigera</Link>
                            </Button> */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
