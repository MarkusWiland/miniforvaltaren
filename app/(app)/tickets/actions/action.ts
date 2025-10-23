// app/(app)/tickets/actions.ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";

/* ----------------------- CREATE ----------------------- */

const CreateSchema = z.object({
  propertyId: z.string().min(1, "Välj fastighet"),
  unitId: z.string().optional().or(z.literal("")),
  tenantId: z.string().optional().or(z.literal("")),
  title: z.string().min(3, "Ange en titel (minst 3 tecken)"),
  description: z.string().optional(),
});

export async function createTicketAction(formData: FormData) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const values = {
    propertyId: (formData.get("propertyId") ?? "").toString(),
    unitId: (formData.get("unitId") ?? "").toString() || undefined,
    tenantId: (formData.get("tenantId") ?? "").toString() || undefined,
    title: (formData.get("title") ?? "").toString(),
    description: (formData.get("description") ?? "").toString() || undefined,
  };

  const parsed = CreateSchema.safeParse(values);
  if (!parsed.success) {
    const params = new URLSearchParams({
      err: parsed.error.issues[0]?.message ?? "Ogiltiga fält",
    });
    if (values.tenantId) params.set("tenantId", values.tenantId);
    if (values.unitId) params.set("unitId", values.unitId);
    redirect(`/tickets/new?${params.toString()}`);
  }

  // 1) Validera fastighet tillhör landlord
  const property = await prisma.property.findFirst({
    where: { id: parsed.data.propertyId, landlordId },
    select: { id: true },
  });
  if (!property) {
    redirect(`/tickets/new?err=${encodeURIComponent("Ogiltig fastighet")}`);
  }

  // 2) Om unitId valts: den måste tillhöra samma landlord OCH fastighet
  if (parsed.data.unitId) {
    const unit = await prisma.unit.findFirst({
      where: {
        id: parsed.data.unitId,
        property: { landlordId }, // <-- relationsfilter (rätt sätt)
        propertyId: parsed.data.propertyId,
      },
      select: { id: true },
    });
    if (!unit) {
      redirect(`/tickets/new?err=${encodeURIComponent("Ogiltig enhet")}`);
    }
  }

  // 3) Om tenantId valts: den måste tillhöra landlord
  if (parsed.data.tenantId) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: parsed.data.tenantId, landlordId },
      select: { id: true },
    });
    if (!tenant) {
      redirect(`/tickets/new?err=${encodeURIComponent("Ogiltig hyresgäst")}`);
    }
  }

  const t = await prisma.ticket.create({
    data: {
      landlordId,
      propertyId: parsed.data.propertyId,
      unitId: parsed.data.unitId || null,
      tenantId: parsed.data.tenantId || null,
      title: parsed.data.title,
      description: parsed.data.description,
      status: "OPEN",
    },
    select: { id: true },
  });

  redirect(`/tickets/${t.id}`);
}

/* ----------------------- UPDATE (metadata) ----------------------- */

const UpdateSchema = z.object({
  ticketId: z.string().min(1),
  title: z.string().min(3, "Ange en titel"),
  description: z.string().optional(),
  tenantId: z.string().optional().or(z.literal("")),
  propertyId: z.string().optional().or(z.literal("")), // om du vill kunna flytta ärende
  unitId: z.string().optional().or(z.literal("")),
});

export async function updateTicketAction(formData: FormData) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const values = {
    ticketId: (formData.get("ticketId") ?? "").toString(),
    title: (formData.get("title") ?? "").toString(),
    description: (formData.get("description") ?? "").toString() || undefined,
    tenantId: (formData.get("tenantId") ?? "").toString() || undefined,
    propertyId: (formData.get("propertyId") ?? "").toString() || undefined,
    unitId: (formData.get("unitId") ?? "").toString() || undefined,
  };

  const parsed = UpdateSchema.safeParse(values);
  if (!parsed.success) {
    redirect(
      `/tickets/${values.ticketId}/edit?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Ogiltiga fält"
      )}`
    );
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: parsed.data.ticketId, landlordId },
    select: { id: true, propertyId: true },
  });
  if (!ticket) redirect("/tickets");

  // Om propertyId byts (valfritt)
  const propertyIdToUse = parsed.data.propertyId || ticket.propertyId;

  // Validera ev. ny property
  const propertyOk = await prisma.property.findFirst({
    where: { id: propertyIdToUse, landlordId },
    select: { id: true },
  });
  if (!propertyOk) {
    redirect(
      `/tickets/${parsed.data.ticketId}/edit?err=${encodeURIComponent(
        "Ogiltig fastighet"
      )}`
    );
  }

  // Om unitId satts, kolla att den hör till samma landlord & property
  if (parsed.data.unitId) {
    const unitOk = await prisma.unit.findFirst({
      where: {
        id: parsed.data.unitId,
        property: { landlordId }, // <-- relationsfilter (rätt sätt)
        propertyId: propertyIdToUse,
      },
      select: { id: true },
    });
    if (!unitOk) {
      redirect(
        `/tickets/${parsed.data.ticketId}/edit?err=${encodeURIComponent(
          "Ogiltig enhet"
        )}`
      );
    }
  }

  // Om tenantId satts, kolla ägarskap
  if (parsed.data.tenantId) {
    const tenantOk = await prisma.tenant.findFirst({
      where: { id: parsed.data.tenantId, landlordId },
      select: { id: true },
    });
    if (!tenantOk) {
      redirect(
        `/tickets/${parsed.data.ticketId}/edit?err=${encodeURIComponent(
          "Ogiltig hyresgäst"
        )}`
      );
    }
  }

  await prisma.ticket.update({
    where: { id: parsed.data.ticketId },
    data: {
      propertyId: propertyIdToUse,
      unitId: parsed.data.unitId || null,
      tenantId: parsed.data.tenantId || null,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });

  redirect(`/tickets/${parsed.data.ticketId}`);
}

/* ----------------------- UPDATE STATUS ----------------------- */

const StatusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]),
});

export async function updateTicketStatusAction(formData: FormData) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const values = {
    ticketId: (formData.get("ticketId") ?? "").toString(),
    status: (formData.get("status") ?? "").toString(),
  };

  const parsed = StatusSchema.safeParse(values);
  if (!parsed.success) redirect("/tickets");

  const exists = await prisma.ticket.findFirst({
    where: { id: parsed.data.ticketId, landlordId },
    select: { id: true },
  });
  if (!exists) redirect("/tickets");

  await prisma.ticket.update({
    where: { id: parsed.data.ticketId },
    data: {
      status: parsed.data.status,
      closedAt: parsed.data.status === "CLOSED" ? new Date() : null,
    },
  });

  redirect(`/tickets/${parsed.data.ticketId}`);
}

/* ----------------------- DELETE ----------------------- */

export async function deleteTicketAction(formData: FormData) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const ticketId = (formData.get("ticketId") ?? "").toString();
  if (!ticketId) redirect("/tickets");

  const exists = await prisma.ticket.findFirst({
    where: { id: ticketId, landlordId },
    select: { id: true },
  });
  if (!exists) redirect("/tickets");

  await prisma.ticket.delete({ where: { id: ticketId } });
  redirect("/tickets");
}
