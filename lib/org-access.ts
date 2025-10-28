// lib/org-access.ts
import { Role } from "@/generated/prisma";
import prisma from "@/lib/prisma";


export async function assertOrgRole(userId: string, organizationId: string, allowed: Role[]) {
  const m = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true },
  });
  if (!m || !allowed.includes(m.role)) {
    throw new Error("NOT_AUTHORIZED");
  }
}
