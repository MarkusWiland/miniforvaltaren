// app/(app)/tenants/actions.ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
});

export async function createTenantAction(formData: FormData) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const values = {
    name: (formData.get("name") ?? "").toString(),
    email: (formData.get("email") ?? "").toString() || undefined,
    phone: (formData.get("phone") ?? "").toString() || undefined,
  };

  const parsed = Schema.safeParse(values);
  if (!parsed.success) {
    const params = new URLSearchParams();
    params.set("err", parsed.error.issues[0]?.message ?? "Ogiltiga fält");
    redirect(`/tenants/new?${params.toString()}`);
  }

  const t = await prisma.tenant.create({
    data: { landlordId, ...parsed.data },
    select: { id: true },
  });

  redirect(`/tenants/${t.id}`);
}

export async function deleteTenantAction(formData: FormData) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });
  const tenantId = (formData.get("tenantId") ?? "").toString();
  if (!tenantId) redirect("/tenants"); // eller kasta fel

  // Säkerställ ägarskap
  const exists = await prisma.tenant.findFirst({
    where: { id: tenantId, landlordId },
    select: { id: true },
  });
  if (!exists) redirect("/tenants");

  // ✅ En rad räcker om du har onDelete: Cascade enligt ovan:
  await prisma.tenant.delete({ where: { id: tenantId } });

  redirect("/tenants");
}

const UpdateSchema = z.object({
  leaseId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  tenantId: z.string().min(1),
  rentAmount: z.coerce.number().int().min(1), // öre
  dueDay: z.coerce.number().int().min(1).max(28),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
});

export async function updateLeaseAction(formData: FormData) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const values = {
    leaseId: (formData.get("leaseId") ?? "").toString(),
    propertyId: (formData.get("propertyId") ?? "").toString(),
    unitId: (formData.get("unitId") ?? "").toString(),
    tenantId: (formData.get("tenantId") ?? "").toString(),
    rentAmount: (formData.get("rentAmount") ?? "").toString(),
    dueDay: (formData.get("dueDay") ?? "").toString(),
    startDate: (formData.get("startDate") ?? "").toString(),
    endDate: (formData.get("endDate") ?? "").toString(),
  };

  const parsed = UpdateSchema.safeParse(values);
  if (!parsed.success) {
    // Skicka tillbaka till edit-sidan
    redirect(
      `/leases/${values.leaseId}/edit?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Ogiltiga fält"
      )}`
    );
  }

  // Säkerställ att leasets nuvarande post tillhör landlord
  const existing = await prisma.lease.findFirst({
    where: { id: parsed.data.leaseId, landlordId },
    select: { id: true },
  });
  if (!existing) redirect("/leases");

  // Säkerställ att unit tillhör property & landlord
  const unit = await prisma.unit.findFirst({
    where: {
      id: parsed.data.unitId,
      property: { id: parsed.data.propertyId, landlordId },
    },
    select: { id: true, propertyId: true },
  });
  if (!unit) {
    redirect(
      `/leases/${parsed.data.leaseId}/edit?err=${encodeURIComponent(
        "Ogiltig enhet eller fastighet"
      )}`
    );
  }

  // Säkerställ att tenant tillhör landlord
  const tenant = await prisma.tenant.findFirst({
    where: { id: parsed.data.tenantId, landlordId },
    select: { id: true },
  });
  if (!tenant) {
    redirect(
      `/leases/${parsed.data.leaseId}/edit?err=${encodeURIComponent(
        "Ogiltig hyresgäst"
      )}`
    );
  }

  await prisma.lease.update({
    where: { id: parsed.data.leaseId },
    data: {
      unitId: unit!.id,
      tenantId: tenant!.id,
      rentAmount: parsed.data.rentAmount,
      dueDay: parsed.data.dueDay,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });

  // Tillbaka till detaljsidan
  redirect(`/leases/${parsed.data.leaseId}`);
}
