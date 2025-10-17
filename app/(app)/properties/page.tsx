// app/(app)/properties/page.tsx
export const runtime = "nodejs";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireLandlordId } from "@/lib/get-session";
import prisma from "@/lib/prisma";

const PAGE_SIZE = 10;

function formatSE(date: Date) {
  return new Date(date).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const skip = (page - 1) * PAGE_SIZE;

  const [total, items] = await Promise.all([
    prisma.property.count({ where: { landlordId } }),
    prisma.property.findMany({
      where: { landlordId },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        _count: { select: { units: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fastigheter</h1>
          <p className="text-sm text-muted-foreground">Hantera dina fastigheter och enheter.</p>
        </div>
        <Button asChild>
          <Link href="/properties/new">Lägg till fastighet</Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Dina fastigheter</CardTitle>
            <Badge variant="secondary">{total} st</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Namn</th>
                    <th className="px-4 py-2 text-left font-medium">Adress</th>
                    <th className="px-4 py-2 text-left font-medium">Enheter</th>
                    <th className="px-4 py-2 text-left font-medium">Skapad</th>
                    <th className="px-4 py-2 text-right font-medium">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3">
                        <Link href={`/properties/${p.id}`} className="font-medium hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{p.address}</td>
                      <td className="px-4 py-3">{p._count.units}</td>
                      <td className="px-4 py-3">{formatSE(p.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/properties/${p.id}`}>Öppna</Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/properties/${p.id}?tab=units`}>Enheter</Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4">
              <span className="text-xs text-muted-foreground">
                Sida {page} av {totalPages}
              </span>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" disabled={page <= 1}>
                  <Link href={`/properties?page=${page - 1}`}>Föregående</Link>
                </Button>
                <Button asChild size="sm" variant="outline" disabled={page >= totalPages}>
                  <Link href={`/properties?page=${page + 1}`}>Nästa</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <h3 className="text-lg font-medium">Inga fastigheter ännu</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Lägg till din första fastighet för att komma igång.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/properties/new">Lägg till fastighet</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
