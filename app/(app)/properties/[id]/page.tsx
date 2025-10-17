// app/(app)/properties/[id]/page.tsx
export const runtime = "nodejs";

import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

function formatSE(date: Date) {
  return new Date(date).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  // Hämta fastigheten och basdata
  const property = await prisma.property.findFirst({
    where: { id: params.id, landlordId },
    include: {
      _count: { select: { units: true } },
    },
  });

  if (!property) notFound();

  // Lista enheter för fastigheten
  const units = await prisma.unit.findMany({
    where: { propertyId: property.id },
    orderBy: { label: "asc" },
  });

  // Lista avtal kopplade via enheter (tenant + unit)
  const leases = await prisma.lease.findMany({
    where: { unit: { propertyId: property.id }, landlordId },
    orderBy: { startDate: "desc" },
    include: {
      tenant: true,
      unit: { include: { property: true } },
    },
  });

  const activeTab = (searchParams?.tab ?? "overview") as
    | "overview"
    | "units"
    | "leases";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {property.name}
          </h1>
          <p className="text-sm text-muted-foreground">{property.address}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`/properties`}>Tillbaka</Link>
          </Button>
          <Image
            src={`/api/properties/${property.id}/qr`}
            alt="QR för felanmälan"
            className="h-40 w-40"
            width={160}
            height={160}
          />
          <Button asChild size="sm" variant="outline">
            <a href={`/api/properties/${property.id}/qr`} download>
              Ladda ner QR
            </a>
          </Button>
          {/* Lägg till en edit-sida senare om du vill */}
          {/* <Button asChild><Link href={`/properties/${property.id}/edit`}>Redigera</Link></Button> */}
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href={`/properties/${property.id}?tab=overview`}>
              Översikt
            </Link>
          </TabsTrigger>
          <TabsTrigger value="units" asChild>
            <Link href={`/properties/${property.id}?tab=units`}>Enheter</Link>
          </TabsTrigger>
          <TabsTrigger value="leases" asChild>
            <Link href={`/properties/${property.id}?tab=leases`}>Avtal</Link>
          </TabsTrigger>
        </TabsList>

        {/* Översikt */}
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Skapad
                </CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-medium">
                {formatSE(property.createdAt)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Enheter
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-2xl font-semibold">
                  {property._count.units}
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/properties/${property.id}?tab=units`}>
                    Visa
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Aktiva avtal
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-2xl font-semibold">
                  {
                    leases.filter(
                      (l) => !l.endDate || new Date(l.endDate) > new Date()
                    ).length
                  }
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/properties/${property.id}?tab=leases`}>
                    Visa
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-6" />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Snabbåtgärder</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={`/leases/new?propertyId=${property.id}`}>
                  Skapa avtal
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/properties/${property.id}?tab=units`}>
                  Hantera enheter
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enheter */}
        <TabsContent value="units">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Enheter</CardTitle>
              <Button asChild size="sm">
                <Link href={`/units/new?propertyId=${property.id}`}>
                  Ny enhet
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {units.length === 0 ? (
                <EmptyRow text="Inga enheter ännu." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="px-4 py-2 text-left font-medium">
                          Label
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Skapad
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Åtgärder
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((u) => (
                        <tr key={u.id} className="border-t">
                          <td className="px-4 py-3">{u.label}</td>
                          <td className="px-4 py-3">
                            {formatSE(
                              (u["createdAt" as never] as unknown as Date) ??
                                new Date()
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-2">
                              {/* Lägg till en egen /units/[id]-sida om du vill */}
                              <Button asChild size="sm" variant="secondary">
                                <Link
                                  href={`/leases/new?propertyId=${property.id}&unitId=${u.id}`}
                                >
                                  Skapa avtal
                                </Link>
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
        </TabsContent>

        {/* Avtal */}
        <TabsContent value="leases">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Avtal</CardTitle>
              <Button asChild size="sm">
                <Link href={`/leases/new?propertyId=${property.id}`}>
                  Nytt avtal
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {leases.length === 0 ? (
                <EmptyRow text="Inga avtal ännu." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="px-4 py-2 text-left font-medium">
                          Hyresgäst
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Enhet
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Hyra/mån
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Förfallodag
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Period
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Åtgärder
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leases.map((l) => (
                        <tr key={l.id} className="border-t">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {l.tenant.name}
                              </span>
                              {/* Visa aktiv/inaktiv badge baserat på endDate */}
                              {!l.endDate ||
                              new Date(l.endDate) > new Date() ? (
                                <Badge variant="secondary">Aktiv</Badge>
                              ) : (
                                <Badge variant="outline">Avslutad</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {l.unit.property.name} • {l.unit.label}
                          </td>
                          <td className="px-4 py-3">
                            {formatSEK(l.rentAmount)}
                          </td>
                          <td className="px-4 py-3">Dag {l.dueDay}</td>
                          <td className="px-4 py-3">
                            {formatSE(l.startDate)} –{" "}
                            {l.endDate ? formatSE(l.endDate) : "Tillsvidare"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-2">
                              {/* Lägg en leases/[id] när du vill */}
                              {/* <Button asChild size="sm" variant="secondary"><Link href={`/leases/${l.id}`}>Öppna</Link></Button> */}
                              <Button asChild size="sm" variant="ghost">
                                <Link href={`/tenants/${l.tenantId}`}>
                                  Hyresgäst
                                </Link>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatSEK(öre: number) {
  const kr = (öre ?? 0) / 100;
  return kr.toLocaleString("sv-SE", { style: "currency", currency: "SEK" });
}

function EmptyRow({ text }: { text: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {text}
      </CardContent>
    </Card>
  );
}
