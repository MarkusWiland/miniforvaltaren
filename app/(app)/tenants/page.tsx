// app/(app)/tenants/page.tsx
export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function TenantsPage({
  searchParams,
}: { searchParams: { q?: string } }) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });
  const q = (searchParams?.q ?? "").trim();

  const tenants = await prisma.tenant.findMany({
    where: {
      landlordId,
      ...(q
        ? { OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ] }
        : {}),
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hyresgäster</h1>
          <p className="text-sm text-muted-foreground">Hantera dina hyresgäster.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/tenants/new">Ny hyresgäst</Link>
          </Button>
        </div>
      </div>

      {/* Sök (länk-baserad, enkel) */}
      <form className="flex gap-2" action="/tenants" method="get">
        <input
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          name="q"
          placeholder="Sök på namn, e-post eller telefon…"
          defaultValue={q}
        />
        <Button type="submit" variant="secondary">Sök</Button>
      </form>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Lista ({tenants.length})</CardTitle>
          <Badge variant="secondary">{tenants.length} st</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {tenants.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Inga hyresgäster.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Namn</th>
                    <th className="px-4 py-2 text-left font-medium">E-post</th>
                    <th className="px-4 py-2 text-left font-medium">Telefon</th>
                    <th className="px-4 py-2 text-right font-medium">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="px-4 py-3">{t.name}</td>
                      <td className="px-4 py-3">{t.email ?? "—"}</td>
                      <td className="px-4 py-3">{t.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/tenants/${t.id}`}>Öppna</Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/leases/new?tenantId=${t.id}`}>Skapa avtal</Link>
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
