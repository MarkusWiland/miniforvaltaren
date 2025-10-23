// app/(public)/report/[token]/report-actions.ts
"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

const PublicSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().optional(),
  title: z.string().min(3),
  description: z.string().min(5),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function publicCreateTicketAction(formData: FormData) {
  const values = {
    propertyId: (formData.get("propertyId") ?? "").toString(),
    unitId: (formData.get("unitId") ?? "").toString() || undefined,
    title: (formData.get("title") ?? "").toString(),
    description: (formData.get("description") ?? "").toString(),
    name: (formData.get("name") ?? "").toString() || undefined,
    email: (formData.get("email") ?? "").toString() || undefined,
    phone: (formData.get("phone") ?? "").toString() || undefined,
  };

  const parsed = PublicSchema.safeParse(values);
  if (!parsed.success) redirect("/report/invalid"); // valfritt felmeddelande

  // Hitta property + landlord
  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    select: { id: true, landlordId: true },
  });
  if (!property) redirect("/report/invalid");

  // (Valfritt) Försök matcha tenant via unitId
  let tenantId: string | null = null;
  if (parsed.data.unitId) {
    const lease = await prisma.lease.findFirst({
      where: {
        unitId: parsed.data.unitId,
        landlordId: property.landlordId,
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
      select: { tenantId: true },
      orderBy: { startDate: "desc" },
    });
    tenantId = lease?.tenantId ?? null;
  }

  await prisma.ticket.create({
    data: {
      landlordId: property.landlordId,
      propertyId: parsed.data.propertyId,
      unitId: parsed.data.unitId,
      title: parsed.data.title,
      description: makeDescription(parsed.data),
      status: "OPEN",
      tenantId,
    },
  });

  redirect("/report/sent"); // tack-sida
}

function makeDescription(d: {
  description: string;
  name?: string;
  email?: string;
  phone?: string;
}) {
  const lines = [d.description.trim()];
  const contact = [
    d.name ? `Namn: ${d.name}` : null,
    d.email ? `E-post: ${d.email}` : null,
    d.phone ? `Telefon: ${d.phone}` : null,
  ].filter(Boolean);
  if (contact.length) lines.push("\nKontaktuppgifter:\n" + contact.join("\n"));
  return lines.join("\n");
}
