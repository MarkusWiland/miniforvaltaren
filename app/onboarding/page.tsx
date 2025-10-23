// app/(app)/onboarding/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser, getSessionLandlordId } from "@/lib/get-session";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

import {
  bulkCreateUnitsAction,
  createFirstPropertyAction,
  createFirstTenantAndLeaseAction,
  saveProfileAction,
} from "./action";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: { step?: string; err?: string };
}) {
  const user = await requireUser();
  const landlordId =
    (await getSessionLandlordId({ ensure: true })) ?? null;
  if (!landlordId) redirect("/sign-in");

  const [landlord, properties] = await Promise.all([
    prisma.landlord.findUnique({
      where: { id: landlordId },
      select: {
        id: true,
        orgName: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.property.findMany({
      where: { landlordId },
      select: {
        id: true,
        name: true,
        address: true,
        _count: { select: { units: true } },
        units: {
          select: { id: true, label: true },
          orderBy: { label: "asc" },
          take: 200,
        },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
  ]);

  const haveProfile = Boolean(landlord?.orgName);
  const haveProperty = properties.length > 0;
  const haveUnits = properties.some((p) => p._count.units > 0);

  // Beräkna steg om det ej är angivet
  const computedStep = !haveProfile ? 1 : !haveProperty ? 2 : !haveUnits ? 3 : 4;
  const step = Number(searchParams?.step ?? computedStep);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Välkommen {user.name ?? ""}! Vi guidar dig igenom 3–4 korta steg.
          </p>
        </div>
        <Badge variant="secondary">Steg {step} / 4</Badge>
      </header>

      {/* STEG 1: Profil */}
      <Card className={step === 1 ? "" : "opacity-70"}>
        <CardHeader>
          <CardTitle className="text-base">1. Din profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ange ditt företagsnamn/hyresvärdsnamn. Du kan ändra detta senare.
          </p>
          <form action={saveProfileAction} className="space-y-3">
            <Input
              name="orgName"
              placeholder="Ex. Wiland Fastigheter AB"
              defaultValue={landlord?.orgName ?? ""}
              required
            />
            <div className="flex gap-2">
              <Button type="submit">Spara &amp; fortsätt</Button>
              {haveProfile ? (
                <Button variant="ghost" asChild>
                  <Link href="/onboarding?step=2">Hoppa till steg 2</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* STEG 2: Första fastighet */}
      <Card className={step === 2 ? "" : "opacity-70"}>
        <CardHeader>
          <CardTitle className="text-base">2. Lägg till fastighet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {haveProperty ? (
            <div className="text-sm">
              <p className="mb-2 text-muted-foreground">Du har redan skapat:</p>
              <ul className="mb-4 list-inside list-disc">
                {properties.map((p) => (
                  <li key={p.id}>
                    <span className="font-medium">{p.name}</span>{" "}
                    <span className="text-muted-foreground">({p.address})</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/onboarding?step=3">Fortsätt till enheter</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/properties/new">Skapa ytterligare fastighet</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form action={createFirstPropertyAction} className="grid gap-3 sm:grid-cols-2">
              <Input name="name" placeholder="Fastighetsnamn" required />
              <Input
                name="address"
                placeholder="Adress (t.ex. Storgatan 12, 411 00 Göteborg)"
                className="sm:col-span-2"
                required
              />
              <div className="sm:col-span-2">
                <Button type="submit">Spara &amp; fortsätt</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* STEG 3: Enheter (bulk) */}
      <Card className={step === 3 ? "" : "opacity-70"}>
        <CardHeader>
          <CardTitle className="text-base">3. Lägg till enheter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Skapa en fastighet i steg 2 först.
            </p>
          ) : (
            <form action={bulkCreateUnitsAction} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  name="propertyId"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue={properties[0].id}
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="self-center text-sm text-muted-foreground">
                  {haveUnits
                    ? "Du har redan enheter – du kan lägga till fler."
                    : "Tips: klistra in flera rader."}
                </div>
              </div>

              <Textarea
                name="labels"
                rows={6}
                placeholder={"Exempel:\nA-101\nA-102\nB-201"}
                defaultValue=""
                required
              />
              <div className="flex items-center gap-2">
                <Button type="submit">
                  {haveUnits ? "Lägg till fler" : "Skapa enheter"}
                </Button>
                {haveUnits ? (
                  <Button variant="ghost" asChild>
                    <Link href="/onboarding?step=4">Fortsätt till avtal</Link>
                  </Button>
                ) : null}
              </div>

              {/* Förhandsvisning om det redan finns */}
              {properties.some((p) => p._count.units > 0) ? (
                <div className="text-sm text-muted-foreground">
                  <div className="mt-2">
                    {properties.map((p) =>
                      p._count.units > 0 ? (
                        <div key={p.id} className="mt-2">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs">
                            {p.units.map((u) => u.label).join(", ")}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              ) : null}
            </form>
          )}
        </CardContent>
      </Card>

      {/* STEG 4: Första hyresgäst + avtal (valfritt) */}
      <Card className={step === 4 ? "" : "opacity-70"}>
        <CardHeader>
          <CardTitle className="text-base">
            4. (Valfritt) Första hyresgäst &amp; avtal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {properties.every((p) => p._count.units === 0) ? (
            <p className="text-sm text-muted-foreground">
              Lägg till minst en enhet i steg 3 för att kunna skapa avtal.
            </p>
          ) : (
            <form action={createFirstTenantAndLeaseAction} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium">Fastighet</label>
                  <select
                    name="propertyId"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    defaultValue={properties[0]?.id}
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Enhet</label>
                  <select
                    name="unitId"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    required
                  >
                    {properties.flatMap((p) =>
                      p.units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {p.name} • {u.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Input name="name" placeholder="Hyresgästens namn" required />
                </div>
                <Input name="phone" placeholder="Telefon (valfritt)" />
                <Input name="email" placeholder="E-post (valfritt)" type="email" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Input name="rentAmountKr" type="number" min={1} placeholder="Hyra (kr/mån)" required />
                <Input name="dueDay" type="number" min={1} max={28} placeholder="Förfallodag (1–28)" required />
                <Input name="startDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit">Skapa hyresgäst &amp; avtal</Button>
                <Button variant="secondary" asChild>
                  <Link href="/dashboard">Hoppa över – gå till dashboard</Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Avslut */}
      {haveProfile && haveProperty && haveUnits ? (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="text-sm">
            <div className="font-medium">Redo!</div>
            <div className="text-muted-foreground">
              Du kan fortsätta härifrån eller gå direkt till dashboarden.
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/properties">Visa fastigheter</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Gå till dashboard</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
