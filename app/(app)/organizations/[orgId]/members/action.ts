// app/(app)/organizations/[orgId]/members/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/get-session";
import { assertOrgRole } from "@/lib/org-access";
import { Role } from "@/generated/prisma";
import { z } from "zod";

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role), // OWNER | ADMIN | MEMBER
});

export async function addMemberAction(orgId: string, formData: FormData) {
  const me = await requireUser(); // { id, email, ... }
  await assertOrgRole(me.id, orgId, [Role.OWNER, Role.ADMIN]);

  const parsed = InviteSchema.safeParse({
    email: (formData.get("email") ?? "").toString().trim(),
    role: (formData.get("role") ?? "MEMBER").toString().toUpperCase(),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (!user) {
    // Välj strategi:
    // 1) Skapa en "pending invite" tabell + skicka e-post med invite-länk
    // 2) Eller returnera fel/meddelande
    // Här: enkel variant — kasta fel
    throw new Error("USER_NOT_FOUND");
  }

  // Skapa medlemskap (idempotent pga @@id)
  await prisma.membership.upsert({
    where: {
      userId_organizationId: { userId: user.id, organizationId: orgId },
    },
    update: { role: parsed.data.role },
    create: { userId: user.id, organizationId: orgId, role: parsed.data.role },
  });
}

const UpdateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(Role),
});

export async function updateMemberRoleAction(
  orgId: string,
  formData: FormData
) {
  const me = await requireUser();
  await assertOrgRole(me.id, orgId, [Role.OWNER]); // bara OWNER får ändra roller (din policy)

  const parsed = UpdateRoleSchema.safeParse({
    userId: (formData.get("userId") ?? "").toString(),
    role: (formData.get("role") ?? "MEMBER").toString().toUpperCase(),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  await prisma.membership.update({
    where: {
      userId_organizationId: {
        userId: parsed.data.userId,
        organizationId: orgId,
      },
    },
    data: { role: parsed.data.role },
  });
}

const RemoveSchema = z.object({ userId: z.string().min(1) });

export async function removeMemberAction(orgId: string, formData: FormData) {
  const me = await requireUser();
  await assertOrgRole(me.id, orgId, [Role.OWNER, Role.ADMIN]);

  const parsed = RemoveSchema.safeParse({
    userId: (formData.get("userId") ?? "").toString(),
  });
  if (!parsed.success) throw new Error("INVALID_INPUT");

  // Skydda mot att ta bort sista OWNER eller dig själv om ensam OWNER
  const target = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: parsed.data.userId,
        organizationId: orgId,
      },
    },
    select: { role: true },
  });
  if (!target) return;

  if (target.role === Role.OWNER) {
    const owners = await prisma.membership.count({
      where: { organizationId: orgId, role: Role.OWNER },
    });
    if (owners <= 1) throw new Error("CANNOT_REMOVE_LAST_OWNER");
  }

  await prisma.membership.delete({
    where: {
      userId_organizationId: {
        userId: parsed.data.userId,
        organizationId: orgId,
      },
    },
  });
}
