// app/(app)/layout.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";


// TODO: ersätt med din riktiga auth-funktion
import { getServerSession, getSessionUser } from "@/lib/get-session";
import { UserNav } from "@/components/user-nav";
import { AppSidebar } from "@/components/app-sidebar";

export const metadata: Metadata = {
  title: "MiniFörvaltaren",
  description: "Enkel fastighetsförvaltning för små svenska hyresvärdar",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Globala länkar i app-ytan
  const links = [
    { name: "Dashboard", href: "/dashboard", icon: "home" as const },
    { name: "Fastigheter", href: "/properties", icon: "building" as const },
    { name: "Hyresgäster", href: "/tenants", icon: "users" as const },
    { name: "Avtal", href: "/leases", icon: "fileText" as const },
    { name: "Avier", href: "/invoices", icon: "receipt" as const },
    { name: "Ärenden", href: "/tickets", icon: "wrench" as const },
    { name: "Inställningar", href: "/settings", icon: "settings" as const },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="grid grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="hidden md:block border-r bg-card/30">
          <AppSidebar user={user} links={links} />
        </aside>

        {/* Mobile topbar + drawer (lätt version – kan byggas ut senare) */}
        <div className="md:hidden border-b bg-card/30">
          <div className="flex items-center justify-between px-3 h-12">
            <Link href="/dashboard" className="font-semibold">
              MiniFörvaltaren
            </Link>
            <UserNav user={user} />
          </div>
        </div>

        {/* Innehåll */}
        <main className="p-4 md:p-6">
          <div className="hidden md:flex justify-end mb-4">
            <UserNav user={user} />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
