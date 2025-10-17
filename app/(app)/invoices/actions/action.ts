// app/(app)/invoices/actions.ts
"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";

export async function markInvoicePaidAction(formData: FormData) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const invoiceId = (formData.get("invoiceId") ?? "").toString();
  if (!invoiceId) redirect("/invoices");

  const inv = await prisma.rentInvoice.findFirst({
    where: { id: invoiceId, landlordId },
    include: { payments: true },
  });
  if (!inv) redirect("/invoices");

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        rentInvoiceId: inv.id,
        amount: inv.amount,
        paidDate: now,
      },
    });

    await tx.rentInvoice.update({
      where: { id: inv.id },
      data: {
        status: "PAID",
        paidAt: now,
      },
    });
  });

  redirect(`/invoices/${invoiceId}`);
}

export async function createInvoiceAction(formData: FormData) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const leaseId = (formData.get("leaseId") ?? "").toString();
  const amountStr = (formData.get("amount") ?? "").toString();
  const dueDateStr = (formData.get("dueDate") ?? "").toString();

  if (!leaseId || !amountStr || !dueDateStr) {
    redirect(`/invoices/new?err=Ogiltiga+fält`);
  }

  const amount = Number.parseInt(amountStr, 10);
  const dueDate = new Date(dueDateStr);
  if (!Number.isFinite(amount) || Number.isNaN(dueDate.getTime())) {
    redirect(`/invoices/new?err=Ogiltigt+belopp+eller+datum`);
  }

  const lease = await prisma.lease.findFirst({ where: { id: leaseId, landlordId } });
  if (!lease) {
    redirect(`/invoices/new?err=Avtal+saknas+eller+otillåtet`);
  }

  const periodYear = dueDate.getFullYear();
  const periodMonth = dueDate.getMonth() + 1; // 1-12

  try {
    const created = await prisma.rentInvoice.create({
      data: {
        landlordId,
        leaseId,
        amount,
        dueDate,
        periodYear,
        periodMonth,
        status: "PENDING",
      },
    });
    redirect(`/invoices/${created.id}`);
  } catch (e: any) {
    if (e?.code === "P2002") {
      redirect(`/invoices/new?err=Avi+finns+redan+för+den+valda+månaden`);
    }
    redirect(`/invoices/new?err=Kunde+inte+skapa+avi`);
  }
}
