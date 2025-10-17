// app/(app)/tenants/new/page.tsx
export const runtime = "nodejs";

import { requireLandlordId } from "@/lib/get-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TenantForm } from "../_components/tenant-form";
import { createTenantAction } from "../actions/action";

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams: { err?: string | string[] };
}) {
  await requireLandlordId({ ensure: true, elseRedirect: "/onboarding" });

  const serverError = Array.isArray(searchParams?.err)
    ? searchParams.err[0]
    : searchParams?.err;

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Ny hyresgäst</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantForm action={createTenantAction} serverError={serverError} />
        </CardContent>
      </Card>
    </div>
  );
}
