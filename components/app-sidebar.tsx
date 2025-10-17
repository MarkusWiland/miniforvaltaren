// components/app-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Building,
  Users,
  FileText,
  Receipt,
  Wrench,
  Settings,
} from "lucide-react";
import * as React from "react";
import { User } from "better-auth";

type IconKey = "home" | "building" | "users" | "fileText" | "receipt" | "wrench" | "settings";

const ICONS: Record<IconKey, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  home: Home,
  building: Building,
  users: Users,
  fileText: FileText,
  receipt: Receipt,
  wrench: Wrench,
  settings: Settings,
};

export function AppSidebar({
  user,
  links,
}: {
  user: User;
  links: { name: string; href: string; icon: IconKey }[];
}) {
  const pathname = usePathname();

  return (
    <div className="h-dvh flex flex-col">
      <div className="h-12 px-4 flex items-center font-semibold">
        MiniFörvaltaren
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="px-2 py-3 space-y-1">
          {links.map((l) => {
            const Icon = ICONS[l.icon];
            const active =
              pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                <span>{l.name}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-3 text-xs text-muted-foreground">
        <div className="font-medium text-foreground">{user.name ?? user.email}</div>
        <div className="truncate">{user.email}</div>
      </div>
    </div>
  );
}
