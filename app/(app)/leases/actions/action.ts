// app/(app)/leases/actions.ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";

const Schema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  tenantId: z.string().min(1),
  rentAmount: z.coerce.number().int().min(1), // öre
  dueDay: z.coerce.number().int().min(1).max(28),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
});

export async function createLeaseAction(formData: FormData) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

  const values = {
    propertyId: (formData.get("propertyId") ?? "").toString(),
    unitId: (formData.get("unitId") ?? "").toString(),
    tenantId: (formData.get("tenantId") ?? "").toString(),
    rentAmount: (formData.get("rentAmount") ?? "").toString(),
    dueDay: (formData.get("dueDay") ?? "").toString(),
    startDate: (formData.get("startDate") ?? "").toString(),
    endDate: (formData.get("endDate") ?? "").toString(),
  };

  const parsed = Schema.safeParse(values);
  if (!parsed.success) {
    const params = new URLSearchParams();
    params.set("err", parsed.error.issues[0]?.message ?? "Ogiltiga fält");
    if (values.propertyId) params.set("propertyId", values.propertyId);
    if (values.unitId) params.set("unitId", values.unitId);
    if (values.tenantId) params.set("tenantId", values.tenantId);
    redirect(`/leases/new?${params.toString()}`);
  }

  // Säkerställ att unit tillhör angiven property OCH landlord
  const unit = await prisma.unit.findFirst({
    where: { id: parsed.data.unitId, property: { id: parsed.data.propertyId, landlordId } },
    select: { id: true, propertyId: true },
  });
  if (!unit) {
    const params = new URLSearchParams();
    params.set("err", "Ogiltig enhet eller fastighet");
    if (values.propertyId) params.set("propertyId", values.propertyId);
    redirect(`/leases/new?${params.toString()}`);
  }

  // Säkerställ att tenant tillhör landlord
  const tenant = await prisma.tenant.findFirst({
    where: { id: parsed.data.tenantId, landlordId },
    select: { id: true },
  });
  if (!tenant) {
    const params = new URLSearchParams();
    params.set("err", "Ogiltig hyresgäst");
    if (values.propertyId) params.set("propertyId", values.propertyId);
    if (values.unitId) params.set("unitId", values.unitId);
    redirect(`/leases/new?${params.toString()}`);
  }

  const lease = await prisma.lease.create({
    data: {
      landlordId,
      unitId: unit!.id,
      tenantId: tenant!.id,
      rentAmount: parsed.data.rentAmount,
      dueDay: parsed.data.dueDay,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
    select: { id: true, unit: { select: { propertyId: true } } },
  });

  // Redirect till fastighetens avtal-flik
  redirect(`/properties/${lease.unit.propertyId}?tab=leases`);
}
