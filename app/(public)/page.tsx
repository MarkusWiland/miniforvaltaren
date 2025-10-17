// app/(public)/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import * as React from "react";

/** ================================
 *  HUVUDKOMPONENT
 *  ================================ */
export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <ValueProps />
      <HowItWorks />
      <FeatureGrid />
      <Pricing />
      <FAQ />
      <SiteFooter />
    </main>
  );
}

/** ================================
 *  HERO
 *  ================================ */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="flex flex-col items-center text-center">
          <Badge className="mb-4" variant="secondary">
            Nytt för svenska hyresvärdar
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Enkel fastighetsförvaltning för{" "}
            <span className="text-primary">små hyresvärdar</span>
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-muted-foreground">
            Samla hyresgäster, avtal och avier på ett ställe. På svenska. Skapat
            för 1–25 enheter — utan krångel eller enterprise-prislappar.
          </p>

          <div className="mt-8 flex w-full max-w-lg flex-col items-center gap-3 sm:flex-row">
            <form
              action="/api/waitlist" // TODO: implementera endpoint
              method="POST"
              className="flex w-full items-center gap-2"
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
                Gå med på väntelistan
              </Button>
            </form>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:underline"
            >
              Redan kund? Logga in
            </Link>
          </div>

          <div className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Building, label: "Fastigheter" },
              { icon: Users, label: "Hyresgäster" },
              { icon: FileText, label: "Avtal" },
              { icon: Receipt, label: "Avier" },
            ].map((f, i) => (
              <Card key={i} className="border-dashed">
                <CardContent className="flex items-center gap-2 p-4">
                  <f.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm">{f.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** ================================
 *  VÄRDEPROPOSITIONER
 *  ================================ */
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
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}

/** ================================
 *  SÅ FUNKAR DET
 *  ================================ */
function HowItWorks() {
  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Så kommer du igång</h2>
          <p className="mt-2 text-muted-foreground">Tre steg. Klar på minuter.</p>
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
function StepCard({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <Badge variant="secondary" className="w-fit">
          Steg {n}
        </Badge>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}

/** ================================
 *  FEATURE GRID (unika saker)
 *  ================================ */
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
      desc: "Svensk marknad i fokus, men skalbart för Norden/EU.",
    },
  ];
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Allt du behöver – inget fluff
          </h2>
          <p className="mt-2 text-muted-foreground">
            Fokus på kärnflödena: fastigheter, hyresgäster, avtal, avier & ärenden.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Card key={it.title} className="h-full">
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

/** ================================
 *  PRICING (med monthly/yearly toggle)
 *  ================================ */
function Pricing() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Enkel prissättning</h2>
          <p className="mt-2 text-muted-foreground">
            Börja gratis. Uppgradera när du växer. Inga bindningstider.
          </p>
        </div>

        <BillingToggle />

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <PlanCard
            badge="Gratis"
            title="FREE"
            priceMonthly={0}
            priceYearly={0}
            unit="/mån"
            features={[
              "Upp till 2 enheter",
              "Obegr. hyresgäster & avtal",
              "Manuell avisering",
              "CSV-export",
            ]}
            cta={{ href: "/register", label: "Börja gratis" }}
          />
          <PlanCard
            highlighted
            badge="Mest populär"
            title="BASIC"
            priceMonthly={99}
            priceYearly={999} // ~2 mån gratis
            unit="kr/mån"
            features={[
              "Upp till 10 enheter",
              "Automatiska avier",
              "E-postpåminnelser",
              "Ärendehantering",
              "Mallbibliotek (avtal/avier)",
              "Export & filter",
              "Grundläggande roller",
            ]}
            cta={{ href: "/register", label: "Välj BASIC" }}
          />
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
              "Avancerade roller & behörigheter",
              "QR-felanmälan",
              "Kommande: Bankkoppling*",
            ]}
            footnote="*Bankkoppling/filimport kommer som tillägg när tillgängligt."
            cta={{ href: "/register", label: "Välj PRO" }}
          />
        </div>
      </div>
    </section>
  );
}

/** Client-del för att toggla månads/års-pris (lättviktigt, inget API) */
function BillingToggle() {
  return (
    <div className="flex items-center justify-center gap-3">
      <Badge variant="outline">Månadsvis</Badge>
      <span className="text-muted-foreground">/</span>
      <Badge variant="secondary">Årsvis – spara 2 månader</Badge>
    </div>
  );
}

function PlanCard({
  badge,
  title,
  priceMonthly,
  priceYearly,
  unit,
  features,
  highlighted,
  cta,
  footnote,
}: {
  badge?: string;
  title: string;
  priceMonthly: number;
  priceYearly: number;
  unit: string;
  features: string[];
  highlighted?: boolean;
  cta: { href: string; label: string };
  footnote?: string;
}) {
  // “Årsvis” som primärt callout – du kan byta till state om du vill göra interaktivt
  const showYearly = true;
  const price = showYearly ? priceYearly : priceMonthly;
  const sub = showYearly ? "år" : "mån";
  const priceLabel =
    price === 0 ? "0 kr/mån" : `${price.toLocaleString("sv-SE")} ${showYearly ? "kr/år" : unit}`;

  return (
    <Card className={highlighted ? "border-primary shadow-sm" : ""}>
      <CardHeader>
        {badge ? (
          <Badge variant={highlighted ? "default" : "secondary"} className="w-fit">
            {badge}
          </Badge>
        ) : null}
        <CardTitle className="mt-1">{title}</CardTitle>
        <div className="text-2xl font-bold">{priceLabel}</div>
        {showYearly && priceMonthly > 0 ? (
          <div className="text-xs text-muted-foreground">
            eller {priceMonthly.toLocaleString("sv-SE")} {unit} (månadsvis)
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <ul className="mb-6 space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
        {footnote ? (
          <p className="mt-3 text-xs text-muted-foreground">{footnote}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** ================================
 *  FAQ
 *  ================================ */
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
            <Card key={item.q}>
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

/** ================================
 *  FOOTER
 *  ================================ */
function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">MiniFörvaltaren</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Integritet
            </Link>
            <Link href="/terms" className="hover:underline">
              Villkor
            </Link>
            <Link href="/login" className="hover:underline">
              Logga in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
