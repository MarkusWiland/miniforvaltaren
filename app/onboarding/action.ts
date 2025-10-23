"use server";

import { getSessionLandlordId, requireUser } from "@/lib/get-session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import z from "zod";

// 1) Spara hyresvärdsprofil (orgName)
export async function saveProfileAction(formData: FormData) {
  const user = await requireUser();
  const landlordId =
    (await getSessionLandlordId({ ensure: true })) ??
    // fallback
    (
      await prisma.landlord.create({
        data: { userId: user.id },
        select: { id: true },
      })
    ).id;

  const orgName = (formData.get("orgName") ?? "").toString().trim();
  if (orgName.length > 0) {
    await prisma.landlord.update({
      where: { id: landlordId },
      data: { orgName },
    });
  }
  redirect("/onboarding?step=2");
}

// 2) Skapa första fastighet
const PropertySchema = z.object({
  name: z.string().min(2, "Ange namn"),
  address: z.string().min(5, "Ange adress"),
});
export async function createFirstPropertyAction(formData: FormData) {
  const landlordId = await getSessionLandlordId({ ensure: true });
  if (!landlordId) redirect("/login");
  const values = {
    name: (formData.get("name") ?? "").toString(),
    address: (formData.get("address") ?? "").toString(),
  };
  const parsed = PropertySchema.safeParse(values);
  if (!parsed.success) return redirect("/onboarding?step=2&err=property");
  await prisma.property.create({
    data: { landlordId, name: parsed.data.name, address: parsed.data.address },
  });
  redirect("/onboarding?step=3");
}

// 3) Bulk-skapa enheter till vald fastighet
const UnitsSchema = z.object({
  propertyId: z.string().min(1),
  labels: z
    .string()
    .min(1, "Ange minst en label")
    .transform((s) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
    )
    .pipe(z.array(z.string()).min(1)),
});
export async function bulkCreateUnitsAction(formData: FormData) {
  const landlordId = await getSessionLandlordId({ ensure: true });
  if (!landlordId) redirect("/login");

  const values = {
    propertyId: (formData.get("propertyId") ?? "").toString(),
    labels: (formData.get("labels") ?? "").toString(),
  };
  const parsed = UnitsSchema.safeParse(values);
  if (!parsed.success) return redirect(`/onboarding?step=3&err=units`);

  const prop = await prisma.property.findFirst({
    where: { id: parsed.data.propertyId, landlordId },
    select: { id: true },
  });
  if (!prop) return redirect(`/onboarding?step=3&err=units`);

  // Skapa unika labels (ignorera dubbletter)
  const existing = await prisma.unit.findMany({
    where: { propertyId: prop.id },
    select: { label: true },
  });
  const existingSet = new Set(existing.map((u) => u.label.toLowerCase()));

  const toCreate = parsed.data.labels.filter(
    (l) => !existingSet.has(l.toLowerCase())
  );
  if (toCreate.length > 0) {
    await prisma.unit.createMany({
      data: toCreate.map((label) => ({ propertyId: prop.id, label })),
      skipDuplicates: true,
    });
  }
  redirect("/onboarding?step=4");
}

// 4) (Valfritt) Skapa första hyresgäst + koppla avtal
const TenantLeaseSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  name: z.string().min(2),
  email: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  phone: z.string().optional(),
  rentAmountKr: z.coerce.number().min(1),
  dueDay: z.coerce.number().int().min(1).max(28),
  startDate: z.string().min(1),
});
export async function createFirstTenantAndLeaseAction(formData: FormData) {
  const landlordId = await getSessionLandlordId({ ensure: true });
  if (!landlordId) redirect("/login");

  const values = {
    propertyId: (formData.get("propertyId") ?? "").toString(),
    unitId: (formData.get("unitId") ?? "").toString(),
    name: (formData.get("name") ?? "").toString(),
    email: (formData.get("email") ?? "").toString(),
    phone: (formData.get("phone") ?? "").toString(),
    rentAmountKr: Number(formData.get("rentAmountKr") ?? 0),
    dueDay: Number(formData.get("dueDay") ?? 1),
    startDate: (formData.get("startDate") ?? "").toString(),
  };
  const parsed = TenantLeaseSchema.safeParse(values);
  if (!parsed.success) return redirect(`/onboarding?step=4&err=tenant`);

  const unit = await prisma.unit.findFirst({
    where: {
      id: parsed.data.unitId,
      property: { id: parsed.data.propertyId, landlordId },
    },
    select: { id: true },
  });
  if (!unit) return redirect(`/onboarding?step=4&err=tenant`);

  const tenant = await prisma.tenant.create({
    data: {
      landlordId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
    },
    select: { id: true },
  });

  await prisma.lease.create({
    data: {
      landlordId,
      unitId: unit.id,
      tenantId: tenant.id,
      rentAmount: Math.round(parsed.data.rentAmountKr * 100),
      dueDay: parsed.data.dueDay,
      startDate: new Date(parsed.data.startDate),
    },
  });

  // Val: kicka igång event (Inngest) för att skapa avi/mail direkt om du vill
  // await inngest.send({ name: "lease/created", data: { leaseId: lease.id } });

  redirect("/dashboard");
}

/* =========================
   PAGE
   ========================= */
