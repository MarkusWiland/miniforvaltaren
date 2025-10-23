"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);
    try {
      await authClient.checkout({ slug: "basic" });
    } catch (e: any) {
      setError(e?.message ?? "Failed to start checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p>Purchase the Basic plan.</p>
      {error ? (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      ) : null}
      <Button onClick={handleCheckout} disabled={loading}>
        {loading ? "Redirecting…" : "Buy Basic"}
      </Button>
    </div>
  );
}
