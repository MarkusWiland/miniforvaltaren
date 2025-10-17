// app/api/properties/[id]/qr/route.ts
import prisma from "@/lib/prisma";
import { requireLandlordId } from "@/lib/get-session";
import QRCode from "qrcode";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  const prop = await prisma.property.findFirst({
    where: { id, landlordId },
    select: { intakeToken: true },
  });
  if (!prop) return new Response("Not found", { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const url = `${appUrl}/report/${prop.intakeToken}`;

  // SVG som sträng (inga Buffer-problem, skalbar i UI)
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 512 });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
