// lib/organizations.ts
import { Role } from "@/generated/prisma";
import prisma from "@/lib/prisma";


export async function ensurePersonalOrg(userId: string, name?: string) {
  const existing = await prisma.membership.findFirst({
    where: { userId },
    select: { organizationId: true, organization: true },
    orderBy: { organizationId: "asc" },
  });
  if (existing) return existing.organization;

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: name ?? "Min organisation",
        createdById: userId,
      },
    });
    await tx.membership.create({
      data: { userId, organizationId: org.id, role: Role.OWNER },
    });
    return org;
  });
}

// Hämta en specifik org (med lite metadata)
export async function getOrganization(orgId: string) {
  return prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { role: "asc" },
      },
    },
  });
}

// Hämta alla orgs som user är medlem i (för org-switcher)
export async function listMyOrganizations(userId: string) {
  const ms = await prisma.membership.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { organizationId: "asc" },
  });
  return ms.map((m) => m.organization);
}
