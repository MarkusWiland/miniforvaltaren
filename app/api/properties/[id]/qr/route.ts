// app/api/properties/[id]/qr/route.ts
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; }> }) {
    const { id } = await params;
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });
  const prop = await prisma.property.findFirst({
    where: { id, landlordId },
    select: { intakeToken: true },
  });
  if (!prop) return new NextResponse("Not found", { status: 404 });

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/report/${prop.intakeToken}`;
  const png = await QRCode.toBuffer(url, { margin: 1, scale: 8 });
  return new NextResponse(png, {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
