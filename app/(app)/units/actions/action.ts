"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";

const Schema = z.object({
  propertyId: z.string().min(1, "Välj fastighet"),
  label: z.string().min(1, "Ange en label, t.ex. A-101"),
});

export async function createUnitAction(formData: FormData) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

  const values = {
    propertyId: (formData.get("propertyId") ?? "").toString(),
    label: (formData.get("label") ?? "").toString(),
  };
  const parsed = Schema.safeParse(values);
  if (!parsed.success) {
    const params = new URLSearchParams();
    params.set("err", parsed.error.issues[0]?.message ?? "Ogiltiga fält");
    if (values.propertyId) params.set("propertyId", values.propertyId);
    redirect(`/units/new?${params.toString()}`);
  }

  // säkerställ att property tillhör landlord
  const prop = await prisma.property.findFirst({
    where: { id: parsed.data.propertyId, landlordId },
    select: { id: true },
  });
  if (!prop) {
    const params = new URLSearchParams();
    params.set("err", "Ogiltig fastighet");
    redirect(`/units/new?${params.toString()}`);
  }

  const unit = await prisma.unit.create({
    data: { propertyId: prop!.id, label: parsed.data.label },
    select: { id: true, propertyId: true },
  });

  // redirect tillbaka till fastigheten (units-fliken) eller till enhetslista
  redirect(`/properties/${unit.propertyId}?tab=units`);
}
