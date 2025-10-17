import { requireLandlordId } from "@/lib/get-session";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { z } from "zod";

const Schema = z.object({
  name: z.string().min(2, "Ange ett namn (minst 2 tecken)"),
  address: z.string().min(5, "Ange en adress (minst 5 tecken)"),
});

export async function createPropertyAction(formData: FormData) {
  "use server";
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const values = {
    name: (formData.get("name") ?? "").toString(),
    address: (formData.get("address") ?? "").toString(),
  };

  const parsed = Schema.safeParse(values);
  if (!parsed.success) {
    // Skicka tillbaka fel via URL params (enkelt) – eller byt till useFormState om du vill.
    const params = new URLSearchParams();
    params.set("err", parsed.error.issues[0]?.message ?? "Ogiltiga fält");
    redirect(`/properties/new?${params.toString()}`);
  }

  const p = await prisma.property.create({
    data: {
      landlordId,
      name: parsed.data.name,
      address: parsed.data.address,
      intakeToken: randomUUID(),
    },
    select: { id: true },
  });

  redirect(`/properties/${p.id}`);
}
