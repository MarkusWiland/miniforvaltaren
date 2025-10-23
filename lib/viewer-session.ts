import { cache } from "react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/get-session";

import { User } from "./auth";
import { Plan } from "@/generated/prisma";

export type Viewer = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
  plan: Plan; // "FREE" | "BASIC" | "PRO" | "ENTERPRISE"
};

export const getViewer = cache(async (): Promise<User | null> => {
  const user = await requireUser(); // redirectar om ej inloggad

  const landlord = await prisma.landlord.findUnique({
    where: { userId: user.id },
    select: { id: true, orgName: true, plan: true },
  });

  if (!landlord) return null;

  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email!,
    emailVerified: user.emailVerified,
    name: user.name ?? null,
    image: (user as any).image ?? null,
    plan: landlord.plan,
  };
});

/** Redirecta till onboarding om landlord saknas */
export async function getViewerOrRedirect(): Promise<User> {
  const viewer = await getViewer();
  if (!viewer) {
    // skapa landlord här om du vill auto-provisionera i stället för redirect
    // await prisma.landlord.create({ data: { userId: user.id, plan: "FREE" } });
    // return (await getViewer())!;

    // eller redirect tills vidare
    const { redirect } = await import("next/navigation");
    redirect("/onboarding");
  }
  return viewer!;   
}
