// lib/guard.ts
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/get-session";
import { hasRoleForPerm, type Perm } from "./acl";

export async function requirePerm(landlordId: string, perm: Perm) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  const member = await prisma.landlordMember.findFirst({
    where: { landlordId, userId: user.id },
    select: { role: true },
  });
  if (!member || !hasRoleForPerm(member.role, perm)) {
    throw new Error("Forbidden");
  }
  return member.role;
}
