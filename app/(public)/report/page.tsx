// app/(public)/report/[token]/page.tsx
export const runtime = "nodejs";

import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PublicReportForm } from "./_components/report-form";


export default async function PublicReportPage({ params }: { params: { token: string } }) {
  const property = await prisma.property.findFirst({
    where: { intakeToken: params.token },
    select: { id: true, name: true, landlordId: true, units: { select: { id: true, label: true }, orderBy: { label: "asc" } } },
  });
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Felanmälan — {property.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <PublicReportForm
            propertyId={property.id}
            units={property.units}
          />
        </CardContent>
      </Card>
    </div>
  );
}
