// app/(app)/dashboard/page.tsx
export const runtime = "nodejs";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import prisma from "@/lib/prisma";
import { getSessionLandlordId } from "@/lib/get-session";

import { startOfMonth as dfStartOfMonth, endOfMonth as dfEndOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const SE_TZ = "Europe/Stockholm";

/**
 * Första sekunden i innevarande månad (lokal tid, t.ex. svensk tid om servern är i CET/CEST)
 */
export function startOfMonthSE(date = new Date()): Date {
  const start = dfStartOfMonth(date);
  // nollställ till exakt midnatt
  start.setHours(0, 0, 0, 0);
  return start;
}
function toSwedishTime(date: Date) {
  // svensk tid = UTC+1 eller +2 beroende på sommartid
  const offsetMinutes = -new Date().getTimezoneOffset() - 60; 
  return new Date(date.getTime() + offsetMinutes * 60_000);
}

/**
 * Sista sekunden i innevarande månad (lokal tid)
 */
export function endOfMonthSE(date = new Date()): Date {
  const end = dfEndOfMonth(date);
  // sätt till 23:59:59.999
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatSE(date: Date) {
  return toSwedishTime(date).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function formatSEK(öre: number) {
  const kr = (öre ?? 0) / 100;
  return kr.toLocaleString("sv-SE", { style: "currency", currency: "SEK" });
}

export default async function DashboardPage() {
  const landlordId = await getSessionLandlordId();
  if (!landlordId) {
    // (app)/layout.tsx bör redan skydda, men fallback:
    return null;
  }

  const now = new Date();                  // UTC "nu"
  const monthStartUTC = startOfMonthSE(now);
  const monthEndUTC = endOfMonthSE(now);

  // Aktiva avtal: startDate <= nu && (endDate IS NULL || endDate > nu)
  const activeLeaseWhere = {
    landlordId,
    startDate: { lte: now },
    OR: [{ endDate: null }, { endDate: { gt: now } }],
  };

  // Parallellt via transaction (en connection)
  const [
    overdueCount,
    dueThisMonthCount,
    paidThisMonthCount,
    openTicketsCount,
    propertiesCount,
    tenantsCount,
    activeLeasesCount,
    upcomingDue,
    recentPayments,
  ] = await prisma.$transaction([
    // Förfallna avier
    prisma.rentInvoice.count({
      where: { landlordId, status: "OVERDUE" },
    }),
    // Avier med förfallodag denna månad (PENDING)
    prisma.rentInvoice.count({
      where: {
        landlordId,
        status: "PENDING",
        dueDate: { gte: monthStartUTC, lte: monthEndUTC },
      },
    }),
    // Betalda denna månad (PAID)
    prisma.rentInvoice.count({
      where: {
        landlordId,
        status: "PAID",
        paidAt: { gte: monthStartUTC, lte: monthEndUTC },
      },
    }),
    // Öppna ärenden (om du har Ticket-model)
    prisma.ticket.count({
      where: { landlordId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.property.count({ where: { landlordId } }),
    prisma.tenant.count({ where: { landlordId } }),
    prisma.lease.count({ where: activeLeaseWhere }),
    // Kommande förfallodatum (PENDING från idag och framåt)
    prisma.rentInvoice.findMany({
      where: { landlordId, status: "PENDING", dueDate: { gte: now } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: {
        lease: {
          include: {
            tenant: true,
            unit: { include: { property: true } },
          },
        },
      },
    }),
    // Senaste betalningar
    prisma.payment.findMany({
      where: { rentInvoice: { landlordId } },
      orderBy: { paidDate: "desc" },
      take: 6,
      include: {
        rentInvoice: {
          include: {
            lease: {
              include: {
                tenant: true,
                unit: { include: { property: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Överblick för{" "}
            {toZonedTime(now, SE_TZ).toLocaleDateString("sv-SE", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/leases/new">Nytt avtal</Link>
          </Button>
          <Button asChild>
            <Link href="/invoices">Visa avier</Link>
          </Button>
        </div>
      </div>

      {/* KPI-kort */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Förfallna avier" value={overdueCount} variant={overdueCount > 0 ? "alert" : "ok"} hint="Behöver åtgärd" />
        <StatCard title="Förfaller denna månad" value={dueThisMonthCount} hint="Obetalda avier" />
        <StatCard title="Betalda denna månad" value={paidThisMonthCount} hint="Kvitton registrerade" />
        <StatCard title="Öppna ärenden" value={openTicketsCount} hint="Felanmälan/ärenden" />
      </div>

      {/* Sektioner */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Vänster kolumn – kommande förfallo */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Kommande förfallodatum</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link href="/invoices">Alla avier</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingDue.length === 0 ? (
              <EmptyRow text="Inga kommande avier." />
            ) : (
              <ScrollArea className="max-h-[360px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="py-2 text-left font-medium">Fastighet/Enhet</th>
                      <th className="py-2 text-left font-medium">Hyresgäst</th>
                      <th className="py-2 text-left font-medium">Förfallodatum</th>
                      <th className="py-2 text-right font-medium">Belopp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingDue.map((inv) => {
                      const { unit, tenant } = inv.lease;
                      return (
                        <tr key={inv.id} className="border-t">
                          <td className="py-2">
                            <Link href={`/invoices/${inv.id}`} className="hover:underline">
                              {unit.property.name} • {unit.label}
                            </Link>
                          </td>
                          <td className="py-2">{tenant.name}</td>
                          <td className="py-2">
                            {formatSE(inv.dueDate)}
                          </td>
                          <td className="py-2 text-right">{formatSEK(inv.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Höger kolumn – snabbstatus */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Snabbstatus</CardTitle>
            <p className="text-sm text-muted-foreground">Ditt innehav i siffror.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fastigheter</span>
              <Badge variant="secondary">{propertiesCount}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Aktiva avtal</span>
              <Badge variant="secondary">{activeLeasesCount}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Hyresgäster</span>
              <Badge variant="secondary">{tenantsCount}</Badge>
            </div>
            <Separator />
            <Button asChild className="w-full">
              <Link href="/properties/new">Lägg till fastighet</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Senaste betalningar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Senaste betalningar</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/invoices">Visa alla</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <EmptyRow text="Inga betalningar registrerade ännu." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="py-2 text-left font-medium">Hyresgäst</th>
                    <th className="py-2 text-left font-medium">Fastighet/Enhet</th>
                    <th className="py-2 text-left font-medium">Betald</th>
                    <th className="py-2 text-right font-medium">Belopp</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => {
                    const l = p.rentInvoice.lease;
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="py-2">{l.tenant.name}</td>
                        <td className="py-2">
                          {l.unit.property.name} • {l.unit.label}
                        </td>
                        <td className="py-2">{formatSE(p.paidDate)}</td>
                        <td className="py-2 text-right">{formatSEK(p.amount)}</td>
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

/* ==== Små hjälpare / komponenter ==== */

function StatCard({
  title,
  value,
  hint,
  variant = "default",
}: {
  title: string;
  value: number | string;
  hint?: string;
  variant?: "default" | "alert" | "ok";
}) {
  const tone =
    variant === "alert"
      ? "text-red-600"
      : variant === "ok"
      ? "text-emerald-600"
      : "text-foreground";
  const bg =
    variant === "alert"
      ? "bg-red-50 dark:bg-red-950/30"
      : variant === "ok"
      ? "bg-emerald-50 dark:bg-emerald-950/30"
      : "bg-muted/30";

  return (
    <Card className={bg}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold ${tone}`}>{value}</div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground">{text}</div>;
}
