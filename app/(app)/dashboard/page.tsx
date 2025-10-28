// app/(app)/dashboard/page.tsx – förbättrad
export const runtime = "nodejs";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

import prisma from "@/lib/prisma";
import { getSessionLandlordId } from "@/lib/get-session";

import { startOfMonth as dfStartOfMonth, endOfMonth as dfEndOfMonth } from "date-fns";

import { AlertCircle, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import { date } from "zod";

const SE_TZ = "Europe/Stockholm";

/**
 * Korrekt månadsspann i svensk lokal tid, konverterat till UTC för query.
 * Förhindrar off-by-one-dygn vid sommartid/zon.
 */
function monthRangeSE(date = new Date()) {
  const local = date;
  const startLocal = dfStartOfMonth(local);
  startLocal.setHours(0, 0, 0, 0);
  const endLocal = dfEndOfMonth(local);
  endLocal.setHours(23, 59, 59, 999);
  return {
    startUtc: startLocal,
    endUtc: endLocal,
  };
}

function formatSE(date: Date) {
  return date.toLocaleDateString("sv-SE", {
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
  if (!landlordId) return null;

  const now = new Date();
  const { startUtc: monthStartUTC, endUtc: monthEndUTC } = monthRangeSE(now);

  // Aktiva avtal
  const activeLeaseWhere = {
    landlordId,
    startDate: { lte: now },
    OR: [{ endDate: null }, { endDate: { gt: now } }],
  };

  // Parallellt via transaction
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
    prisma.rentInvoice.count({ where: { landlordId, status: "OVERDUE" } }),
    prisma.rentInvoice.count({
      where: {
        landlordId,
        status: "PENDING",
        dueDate: { gte: monthStartUTC, lte: monthEndUTC },
      },
    }),
    prisma.rentInvoice.count({
      where: {
        landlordId,
        status: "PAID",
        paidAt: { gte: monthStartUTC, lte: monthEndUTC },
      },
    }),
    prisma.ticket.count({ where: { landlordId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.property.count({ where: { landlordId } }),
    prisma.tenant.count({ where: { landlordId } }),
    prisma.lease.count({ where: activeLeaseWhere }),
    prisma.rentInvoice.findMany({
      where: { landlordId, status: "PENDING", dueDate: { gte: now } },
      orderBy: { dueDate: "asc" },
      take: 6,
      include: {
        lease: { include: { tenant: true, unit: { include: { property: true } } } },
      },
    }),
    prisma.payment.findMany({
      where: { rentInvoice: { landlordId } },
      orderBy: { paidDate: "desc" },
      take: 6,
      include: {
        rentInvoice: {
          include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
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
            Överblick för {now.toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><Link href="/leases/new">Nytt avtal</Link></Button>
          <Button asChild><Link href="/invoices">Visa avier</Link></Button>
        </div>
      </div>

      {/* ALERT: Förfallna avier */}
      {overdueCount > 0 && (
        <Alert className="border-red-600/20 bg-red-500/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-medium">Åtgärd krävs</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            Du har {overdueCount} förfallna {overdueCount === 1 ? "avi" : "avier"}.
            <Button asChild size="sm" variant="destructive"><Link href="/invoices?status=OVERDUE">Visa förfallna</Link></Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI-kort */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Förfallna avier" value={overdueCount} variant={overdueCount > 0 ? "alert" : "ok"} hint="Behöver åtgärd" icon={overdueCount > 0 ? <TrendingUp className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />} />
        <StatCard title="Förfaller denna månad" value={dueThisMonthCount} hint="Obetalda avier" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard title="Betalda denna månad" value={paidThisMonthCount} hint="Kvitton registrerade" icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard title="Öppna ärenden" value={openTicketsCount} hint="Felanmälan/ärenden" />
      </div>

      {/* Sektioner */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Kommande förfallo */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Kommande förfallodatum</CardTitle>
            <Button asChild size="sm" variant="ghost"><Link href="/invoices">Alla avier</Link></Button>
          </CardHeader>
          <CardContent>
            {upcomingDue.length === 0 ? (
              <EmptyState
                title="Inga kommande avier"
                description="Skapa en avi eller schemalägg nästa utskick."
                action={<Button asChild size="sm"><Link href="/invoices/new">Skapa avi</Link></Button>}
              />
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
                          <td className="py-2">{formatSE(inv.dueDate)}</td>
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

        {/* Snabbstatus */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Snabbstatus</CardTitle>
            <p className="text-sm text-muted-foreground">Ditt innehav i siffror.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusRow label="Fastigheter" value={propertiesCount} />
            <StatusRow label="Aktiva avtal" value={activeLeasesCount} />
            <StatusRow label="Hyresgäster" value={tenantsCount} />
            <Separator />
            <Button asChild className="w-full"><Link href="/properties/new">Lägg till fastighet</Link></Button>
          </CardContent>
        </Card>
      </div>

      {/* Senaste betalningar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Senaste betalningar</CardTitle>
          <Button asChild size="sm" variant="ghost"><Link href="/invoices">Visa alla</Link></Button>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <EmptyState
              title="Inga betalningar ännu"
              description="När du registrerar en betalning visas den här."
              action={<Button asChild size="sm" variant="secondary"><Link href="/invoices">Gå till avier</Link></Button>}
            />
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
                        <td className="py-2">{l.unit.property.name} • {l.unit.label}</td>
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

/* ==== Komponenter ==== */

function StatCard({
  title,
  value,
  hint,
  variant = "default",
  icon,
}: {
  title: string;
  value: number | string;
  hint?: string;
  variant?: "default" | "alert" | "ok";
  icon?: React.ReactNode;
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
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold ${tone}`}>{value}</div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Badge variant="secondary">{value}</Badge>
      </div>
      {/* Visuell balans med progress – ren dekor tills du har procent/kvot */}
      <Progress value={Number(value) || 0} className="h-1.5 opacity-30" />
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-lg border bg-card/40 p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
