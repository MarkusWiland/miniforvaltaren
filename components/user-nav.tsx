// components/user-nav.tsx
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { User } from "better-auth";

// TODO: byt mot din riktiga signOut-funktion
async function signOut() {
  await fetch("/api/auth/signout", { method: "POST" });
  window.location.href = "/login";
}

export function UserNav({ user }: { user: User }) {
  const initials = (
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("") ||
    user.email?.[0] ||
    "?"
  ).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="text-xs text-muted-foreground">
          {user.name ?? user.email}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          Logga ut
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
