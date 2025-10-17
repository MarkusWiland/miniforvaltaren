import { requireLandlordId } from "@/lib/get-session";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyForm } from "../_components/properties-form";
import { createPropertyAction } from "../actions/action";

// ------- Server component (sidan) ------- //
export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: { err?: string | string[] };
}) {
  const landlordId = await requireLandlordId({
    ensure: true,
    elseRedirect: "/onboarding",
  });
  // landlordId används endast för att garantera åtkomst; inget mer behövs här.

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Ny fastighet</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm
            action={createPropertyAction}
            serverError={
              Array.isArray(searchParams?.err)
                ? searchParams.err[0]
                : searchParams?.err
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
