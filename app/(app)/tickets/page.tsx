// app/(app)/tickets/page.tsx
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

type StatusParam = "open" | "in_progress" | "closed";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams?: { status?: StatusParam; q?: string };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const q = (searchParams?.q ?? "").trim();
  const statusParam = searchParams?.status;

  const where: any = { landlordId };
  if (statusParam) {
    // mappa till DB-status (versaler)
    const map: Record<StatusParam, string> = {
      open: "OPEN",
      in_progress: "IN_PROGRESS",
      closed: "CLOSED",
    };
    where.status = map[statusParam];
  }
  if (q) {
    // enkel fritext över title/description
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      tenant: true, // valfritt: visas om finns
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ärenden</h1>
          <p className="text-sm text-muted-foreground">
            Hantera felanmälningar och ärenden.
          </p>
        </div>
        <Button asChild>
          <Link href="/tickets/new">Nytt ärende</Link>
        </Button>
      </div>

      {/* Filter + Sök */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              variant={!statusParam ? "default" : "outline"}
            >
              <Link href={`/tickets${q ? `?q=${encodeURIComponent(q)}` : ""}`}>
                Alla
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={statusParam === "open" ? "default" : "outline"}
            >
              <Link
                href={`/tickets?status=open${
                  q ? `&q=${encodeURIComponent(q)}` : ""
                }`}
              >
                Öppna
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={statusParam === "in_progress" ? "default" : "outline"}
            >
              <Link
                href={`/tickets?status=in_progress${
                  q ? `&q=${encodeURIComponent(q)}` : ""
                }`}
              >
                Pågår
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={statusParam === "closed" ? "default" : "outline"}
            >
              <Link
                href={`/tickets?status=closed${
                  q ? `&q=${encodeURIComponent(q)}` : ""
                }`}
              >
                Avslutade
              </Link>
            </Button>
          </div>

          <form className="ml-auto flex w-full gap-2 sm:w-auto" action="/tickets" method="get">
            {statusParam ? (
              <input type="hidden" name="status" value={statusParam} />
            ) : null}
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-[280px]"
              name="q"
              placeholder="Sök i titel/beskrivning…"
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
          <CardTitle className="text-base">Ärenden ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Inga ärenden hittades.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Titel</th>
                    <th className="px-4 py-2 text-left font-medium">Hyresgäst</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-left font-medium">Skapad</th>
                    <th className="px-4 py-2 text-right font-medium">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const statusBadge =
                      t.status === "OPEN"
                        ? { label: "Öppen", variant: "default" as const }
                        : t.status === "IN_PROGRESS"
                        ? { label: "Pågår", variant: "secondary" as const }
                        : { label: "Avslutad", variant: "outline" as const };

                    return (
                      <tr key={t.id} className="border-t">
                        <td className="px-4 py-3">
                          <Link
                            href={`/tickets/${t.id}`}
                            className="font-medium hover:underline"
                          >
                            {t.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {t.tenant ? t.tenant.name : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{formatSE(t.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/tickets/${t.id}`}>Öppna</Link>
                            </Button>
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/tickets/${t.id}/edit`}>Redigera</Link>
                            </Button>
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
