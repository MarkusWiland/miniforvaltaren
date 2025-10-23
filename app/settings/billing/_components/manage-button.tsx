// app/(app)/settings/billing/_components/manage-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={async () => {
          setErr(null);
          setLoading(true);
          try {
            const res = await fetch("/api/billing/portal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body?.error ?? `HTTP ${res.status}`);
            }
            const { url } = (await res.json()) as { url: string };
            if (!url) throw new Error("Saknar portal-URL");
            window.location.href = url;
          } catch (e: any) {
            setErr(e?.message ?? "Kunde inte öppna kundportal");
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
      >
        {loading ? "Öppnar…" : "Hantera prenumeration"}
      </Button>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
    </div>
  );
}
