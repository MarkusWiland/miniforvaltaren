// server/session.ts
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, User } from "./auth";
import prisma from "./prisma";

// 1) Hämta session (cachas per request)
export const getServerSession = cache(async () => {
  return await auth.api.getSession({ headers: await headers() });
});

// 2) Hämta nuvarande user (eller null)
export const getSessionUser = cache(async (): Promise<User | null> => {
  const session = await getServerSession();
  // Anpassa beroende på vad ditt auth returnerar
  // Better Auth brukar ha session.user eller session.userId
  const user = session?.user ?? null;
  return user as User | null;
});

// 3) Hämta landlordId (idempotent med upsert)
export const getSessionLandlordId = cache(
  async (opts?: { ensure?: boolean }) => {
    const user = await getSessionUser();
    if (!user) return null;

    // Finns redan?
    const existing = await prisma.landlord.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (existing) return existing.id;

    if (opts?.ensure) {
      // Idempotent skapande
      const row = await prisma.landlord.upsert({
        where: { userId: user.id },
        update: {}, // inget att uppdatera här
        create: { userId: user.id }, // lägg till ev. defaultfält här
        select: { id: true },
      });
      return row.id;
    }
    return null;
  }
);

// 4) “Require”-varianter för sidor/actions
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireLandlordId(opts?: {
  ensure?: boolean;
  elseRedirect?: string;
}) {
  await requireUser();
  const landlordId = await getSessionLandlordId({ ensure: opts?.ensure });
  if (!landlordId) {
    // t.ex. skicka till onboarding om du inte auto-skapar
    redirect(opts?.elseRedirect ?? "/onboarding");
  }
  return landlordId!;
}
