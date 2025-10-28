"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Check,
  ArrowRight,
  Building,
  FileText,
  Receipt,
  Users,
  Shield,
  Clock,
  QrCode,
  Download,
  Settings,
  Mail,
  Bell,
  Lock,
  Globe,
} from "lucide-react";

import PlanCard from "./_components/plan-card";
import { authClient } from "@/lib/auth-client";
import { HeroHeader } from "@/components/header";
import HeroSection from "@/components/hero-section";

/* =========================
 *  PAGE
 * ========================= */
export default function PublicHomePage() {
  return (
    <main className="">
      <HeroHeader />
      <HeroSection />
    </main>
  );
}

/* =========================
 *  STICKY HEADER
 * ========================= */
function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="h-6 w-6 rounded-md bg-primary/15 ring-1 ring-primary/20" />
          MiniFörvaltaren
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="#features"
            className="text-muted-foreground hover:text-foreground"
          >
            Funktioner
          </Link>
          <Link
            href="#pricing"
            className="text-muted-foreground hover:text-foreground"
          >
            Priser
          </Link>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground"
          >
            Logga in
          </Link>
          <Button asChild size="sm">
            <Link href="/register">Kom igång</Link>
          </Button>
        </nav>
        {/* Mobile – minimalistiskt */}
        <div className="md:hidden">
          <Button asChild size="sm" variant="outline">
            <Link href="/register">Kom igång</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* =========================
 *  HERO – mörk, med screenshot
 * ========================= */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient & grid bakgrund */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_-10%,hsl(var(--primary)/0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,.4))]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Copy + CTA */}
          <div className="text-center lg:text-left">
            <Badge className="mb-4" variant="secondary">
              Nytt för svenska hyresvärdar
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              Enkel förvaltning för{" "}
              <span className="text-primary">små hyresvärdar</span>
            </h1>
            <p className="mt-4 text-balance text-muted-foreground sm:text-lg">
              Samla hyresgäster, avtal och avier på ett ställe. Automatisera
              aviseringar och få stenkoll — på svenska.
            </p>

            {/* CTA-row */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-stretch">
              <form
                action="/api/waitlist"
                method="POST"
                className="flex w-full max-w-md items-center gap-2"
              >
                <Input
                  name="email"
                  type="email"
                  placeholder="Din e-post"
                  aria-label="E-post för väntelista"
                  required
                  className="flex-1"
                />
                <Button type="submit" className="whitespace-nowrap">
                  Gå med
                </Button>
              </form>
              <Button asChild variant="ghost">
                <Link href="/sign-in">Redan kund? Logga in</Link>
              </Button>
            </div>

            {/* Mini feature chips */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Building, label: "Fastigheter" },
                { icon: Users, label: "Hyresgäster" },
                { icon: FileText, label: "Avtal" },
                { icon: Receipt, label: "Avier" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 rounded-lg border bg-card/40 px-3 py-2 text-sm"
                >
                  <f.icon className="h-4 w-4 text-primary" />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Screenshot – byt ut bilden till din */}
          <div className="relative">
            {/* Glow */}
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[30px] bg-primary/20 blur-3xl" />
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-b from-background to-background/60 shadow-2xl">
              <div className="relative">
                <Image
                  src="/hero-dashboard.png" // <-- lägg din export i /public
                  alt="MiniFörvaltaren dashboard"
                  width={1200}
                  height={680}
                  priority
                  className="h-auto w-full"
                />
                {/* Subtle overlay för att smälta in */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
              </div>
            </Card>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Skärmklipp från appen (demo-data).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
 *  VALUE PROPS
 * ========================= */
function ValueProps() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <ValueCard
            icon={Clock}
            title="Spara tid varje månad"
            desc="Automatiska avier, påminnelser och översikter. Slipp manuell admin."
          />
          <ValueCard
            icon={Shield}
            title="Tryggt & enkelt"
            desc="Svenskt UI, roller & rättigheter, spårbar historik per hyresgäst."
          />
          <ValueCard
            icon={Receipt}
            title="Bättre koll på pengar"
            desc="Status för hyror, förfallna belopp och enkel CSV/Excel-export."
          />
        </div>
      </div>
    </section>
  );
}

function ValueCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
}) {
  return (
    <Card className="bg-card/40">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {desc}
      </CardContent>
    </Card>
  );
}

/* =========================
 *  HOW IT WORKS
 * ========================= */
function HowItWorks() {
  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Så kommer du igång
          </h2>
          <p className="mt-2 text-muted-foreground">
            Tre steg. Klar på minuter.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <StepCard
            n={1}
            title="Lägg till fastighet & enheter"
            desc="Registrera din första fastighet och lägenheter/rum."
          />
          <StepCard
            n={2}
            title="Skapa hyresgäst & avtal"
            desc="Sätt hyra, förfallodag och kontraktsperiod."
          />
          <StepCard
            n={3}
            title="Skicka avier automatiskt"
            desc="Generera avier och e-postpåminnelser varje månad."
          />
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <Link href="/register">
              Börja gratis <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc: string;
}) {
  return (
    <Card className="bg-card/40">
      <CardHeader className="space-y-1">
        <Badge variant="secondary" className="w-fit">
          Steg {n}
        </Badge>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {desc}
      </CardContent>
    </Card>
  );
}

/* =========================
 *  FEATURE GRID
 * ========================= */
function FeatureGrid() {
  const items = [
    {
      icon: QrCode,
      title: "QR-felanmälan",
      desc: "Unik QR per fastighet. Boende kan rapportera fel utan konto.",
    },
    {
      icon: Settings,
      title: "Roller & rättigheter",
      desc: "RBAC för att bjuda in ekonomi/tekniker utan full åtkomst.",
    },
    {
      icon: Bell,
      title: "Påminnelser via e-post",
      desc: "Automatiska påminnelser före och efter förfallodag.",
    },
    {
      icon: Download,
      title: "Exportera data",
      desc: "Ladda ned avier, betalningar och hyresgästlistor till CSV/Excel.",
    },
    {
      icon: Lock,
      title: "Säkerhet först",
      desc: "Sessionskydd, auditloggar och ISO-vänlig datamodell.",
    },
    {
      icon: Globe,
      title: "På svenska – redo för fler språk",
      desc: "Fokus på Sverige, skalbart för Norden/EU.",
    },
  ];
  return (
    <section id="features" className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Allt du behöver – inget fluff
          </h2>
          <p className="mt-2 text-muted-foreground">
            Fastigheter, hyresgäster, avtal, avier & ärenden — snyggt paketerat.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Card key={it.title} className="h-full bg-card/40">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="rounded-md bg-primary/10 p-2">
                  <it.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{it.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {it.desc}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================
 *  PRICING (Polar checkout)
 * ========================= */
function Pricing() {
  return (
    <section id="pricing" className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Enkel prissättning
          </h2>
          <p className="mt-2 text-muted-foreground">
            Börja gratis. Uppgradera när du växer. Inga bindningstider.
          </p>
        </div>

        <BillingToggle />

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {/* FREE */}
          <PlanCard
            badge="Gratis"
            title="FREE"
            priceMonthly={0}
            priceYearly={0}
            unit="kr/mån"
            features={[
              "Upp till 2 enheter",
              "Obegr. hyresgäster & avtal",
              "Manuell avisering",
              "CSV-export",
            ]}
            ctaSlot={
              <Link className="w-full" href="/register">
                <Button className="w-full">Börja gratis</Button>
              </Link>
            }
          />

          {/* BASIC */}
          <PlanCard
            highlighted
            badge="Mest populär"
            title="BASIC"
            priceMonthly={99}
            priceYearly={999}
            unit="kr/mån"
            features={[
              "Upp till 10 enheter",
              "Automatiska avier",
              "E-postpåminnelser",
              "Ärendehantering",
              "Mallbibliotek",
              "Export & filter",
              "Grundläggande roller",
            ]}
            ctaSlot={
              <Button
                className="w-full"
                onClick={() => authClient.checkout({ slug: "basic" })}
              >
                Välj BASIC
              </Button>
            }
          />

          {/* PRO */}
          <PlanCard
            badge="För växande"
            title="PRO"
            priceMonthly={249}
            priceYearly={2490}
            unit="kr/mån"
            features={[
              "Upp till 25 enheter",
              "Flera fastigheter",
              "Prioriterad support",
              "Avancerade roller",
              "QR-felanmälan",
              "Kommande: Bankkoppling*",
            ]}
            footnote="*Bankkoppling/filimport kommer som tillägg när tillgängligt."
            ctaSlot={
              <Button
                className="w-full"
                onClick={() => authClient.checkout({ slug: "pro" })}
              >
                Välj PRO
              </Button>
            }
          />
        </div>

        {/* Enterprise – egen rad */}
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <PlanCard
            badge="Större behov"
            title="ENTERPRISE"
            priceMonthly={0}
            priceYearly={0}
            unit=""
            features={[
              "Skräddarsydda limits",
              "SLA & dedikerad support",
              "SSO/SAML",
              "Utökade säkerhetskrav",
            ]}
            ctaSlot={
              <Button
                className="w-full"
                onClick={() => authClient.checkout({ slug: "enterprise" })}
              >
                Kontakta sälj
              </Button>
            }
          />
        </div>
      </div>
    </section>
  );
}

/* “Toggle” – statisk visning (du kan göra den interaktiv senare) */
function BillingToggle() {
  return (
    <div className="flex items-center justify-center gap-3">
      <Badge variant="outline">Månadsvis</Badge>
      <span className="text-muted-foreground">/</span>
      <Badge variant="secondary">Årsvis – spara 2 månader</Badge>
    </div>
  );
}

/* =========================
 *  FAQ
 * ========================= */
function FAQ() {
  const items: { q: string; a: React.ReactNode }[] = [
    {
      q: "Vad menar ni med enheter?",
      a: "En enhet är t.ex. en lägenhet, lokal eller ett rum du tar betalt för. Planerna begränsar hur många enheter du kan hantera.",
    },
    {
      q: "Kan jag importera befintliga hyresgäster/avtal?",
      a: "Ja, via CSV-import. PRO har fler import/export-alternativ.",
    },
    {
      q: "Stöder ni e-fakturor eller bankkoppling?",
      a: "Vi börjar med e-postavier och betalningsregistrering. Bankkoppling/filimport kommer som tillägg.",
    },
    {
      q: "Behöver hyresgäster konto?",
      a: "Nej. Via QR-felanmälan kan boende lämna ärenden utan konto.",
    },
    {
      q: "Hur fungerar roller?",
      a: "Bjud in t.ex. ekonomiansvarig eller tekniker med begränsad åtkomst (RBAC).",
    },
  ];
  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Vanliga frågor</h2>
          <p className="mt-2 text-muted-foreground">
            Något annat du undrar? Hör gärna av dig!
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.q} className="bg-card/40">
              <CardHeader>
                <CardTitle className="text-base">{item.q}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {item.a}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 text-sm">
          <Mail className="h-4 w-4" />
          <span>
            Mejla oss:{" "}
            <a className="underline" href="mailto:support@miniforvaltaren.se">
              support@miniforvaltaren.se
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}

/* =========================
 *  FOOTER
 * ========================= */
function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              MiniFörvaltaren
            </span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Integritet
            </Link>
            <Link href="/terms" className="hover:underline">
              Villkor
            </Link>
            <Link href="/sign-in" className="hover:underline">
              Logga in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
