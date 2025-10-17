import { requireLandlordId } from "@/lib/get-session";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitForm } from "../_components/unit-form";
import { createUnitAction } from "../actions/action";

export default async function NewUnitPage({
  searchParams,
}: {
  searchParams: { propertyId?: string; err?: string | string[] };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });

  // valfritt: förifyll property och säkerställ ägarskap om medskickat
  let property: { id: string; name: string } | null = null;
  if (searchParams?.propertyId) {
    property = await prisma.property.findFirst({
      where: { id: searchParams.propertyId, landlordId },
      select: { id: true, name: true },
    });
  }

  const serverError = Array.isArray(searchParams?.err)
    ? searchParams.err[0]
    : searchParams?.err;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Ny enhet</CardTitle>
        </CardHeader>
        <CardContent>
          <UnitForm
            action={createUnitAction}
            initialProperty={property}
            serverError={serverError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
