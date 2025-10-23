// app/(app)/settings/billing/page.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ManageSubscriptionButton } from "./_components/manage-button";
import { authClient } from "@/lib/auth-client";

export default function BillingPage() {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await authClient.customer.state(); // kund + aktiva subscriptions/benefits
      setState(data);
    })();
  }, []);

  const sub = state?.subscriptions?.[0];
  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <Card>
        <CardHeader><CardTitle>Din plan</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div>Plan: <strong>{sub?.product?.name ?? "FREE"}</strong></div>
          <div>Nästa debitering: {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("sv-SE") : "—"}</div>
          <ManageSubscriptionButton />
        </CardContent>
      </Card>
    </div>
  );
}
