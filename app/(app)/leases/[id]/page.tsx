// app/(app)/leases/[id]/page.tsx
export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default async function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
    const { id } = await params;
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const lease = await prisma.lease.findFirst({
    where: { id, landlordId },
    include: {
      tenant: true,
      unit: { include: { property: true } },
    },
  });

  if (!lease) notFound();

  const isActive =
    !lease.endDate || new Date(lease.endDate) > new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Avtal</h1>
          <p className="text-sm text-muted-foreground">
            {lease.tenant.name} • {lease.unit.property.name} / {lease.unit.label}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/leases">Tillbaka</Link>
          </Button>
          <Button asChild>
            <Link href={`/leases/${lease.id}/edit`}>Redigera</Link>
          </Button>
        </div>
      </div>

      {/* Avtalsinfo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detaljer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm text-muted-foreground">Hyresgäst</div>
            <div className="font-medium">{lease.tenant.name}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Fastighet</div>
            <div className="font-medium">{lease.unit.property.name}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Enhet</div>
            <div className="font-medium">{lease.unit.label}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Hyra per månad</div>
            <div className="font-medium">{formatSEK(lease.rentAmount)}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Förfallodag</div>
            <div className="font-medium">Dag {lease.dueDay}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Startdatum</div>
            <div className="font-medium">{formatSE(lease.startDate)}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Slutdatum</div>
            <div className="font-medium">
              {lease.endDate ? formatSE(lease.endDate) : "Tillsvidare"}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <Badge variant={isActive ? "secondary" : "outline"}>
              {isActive ? "Aktivt" : "Avslutat"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Länkar till relaterat */}
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={`/tenants/${lease.tenant.id}`}>
            Visa hyresgäst
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/properties/${lease.unit.property.id}`}>
            Visa fastighet
          </Link>
        </Button>
      </div>
    </div>
  );
}
