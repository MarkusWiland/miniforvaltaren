// app/(app)/tickets/actions.ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";

const CreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  tenantId: z.string().optional(),
});

export async function createTicketAction(formData: FormData) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

  const values = {
    title: (formData.get("title") ?? "").toString(),
    description: (formData.get("description") ?? "").toString() || undefined,
    tenantId: (formData.get("tenantId") ?? "").toString() || undefined,
  };

  const parsed = CreateSchema.safeParse(values);
  if (!parsed.success) {
    const params = new URLSearchParams();
    params.set("err", parsed.error.issues[0]?.message ?? "Ogiltiga fält");
    if (values.tenantId) params.set("tenantId", values.tenantId);
    redirect(`/tickets/new?${params.toString()}`);
  }

  // Om tenantId angetts, säkra ägarskap
  if (parsed.data.tenantId) {
    const ok = await prisma.tenant.findFirst({
      where: { id: parsed.data.tenantId, landlordId },
      select: { id: true },
    });
    if (!ok) {
      const params = new URLSearchParams();
      params.set("err", "Ogiltig hyresgäst");
      redirect(`/tickets/new?${params.toString()}`);
    }
  }

  const t = await prisma.ticket.create({
    data: {
      landlordId,
      title: parsed.data.title,
      description: parsed.data.description,
      tenantId: parsed.data.tenantId,
      status: "OPEN",
    },
    select: { id: true },
  });

  redirect(`/tickets/${t.id}`);
}

const UpdateSchema = z.object({
  ticketId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional(),
  tenantId: z.string().optional().or(z.literal("")),
});

export async function updateTicketAction(formData: FormData) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

  const values = {
    ticketId: (formData.get("ticketId") ?? "").toString(),
    title: (formData.get("title") ?? "").toString(),
    description: (formData.get("description") ?? "").toString() || undefined,
    tenantId: (formData.get("tenantId") ?? "").toString() || undefined,
  };

  const parsed = UpdateSchema.safeParse(values);
  if (!parsed.success) {
    redirect(`/tickets/${values.ticketId}/edit?err=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Ogiltiga fält")}`);
  }

  // Säkra att ticket tillhör landlord
  const exists = await prisma.ticket.findFirst({
    where: { id: parsed.data.ticketId, landlordId },
    select: { id: true },
  });
  if (!exists) redirect("/tickets");

  // Om tenantId angetts, säkra ägarskap
  if (parsed.data.tenantId) {
    const ok = await prisma.tenant.findFirst({
      where: { id: parsed.data.tenantId, landlordId },
      select: { id: true },
    });
    if (!ok) redirect(`/tickets/${parsed.data.ticketId}/edit?err=${encodeURIComponent("Ogiltig hyresgäst")}`);
  }

  await prisma.ticket.update({
    where: { id: parsed.data.ticketId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      tenantId: parsed.data.tenantId || null,
    },
  });

  redirect(`/tickets/${parsed.data.ticketId}`);
}

const StatusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]),
});

export async function updateTicketStatusAction(formData: FormData) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

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
    data: { status: parsed.data.status },
  });

  redirect(`/tickets/${parsed.data.ticketId}`);
}

export async function deleteTicketAction(formData: FormData) {
  const landlordId = await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });
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
