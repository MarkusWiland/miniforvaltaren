'use client'
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import * as React from "react";

export default function PlanCard({
  badge,
  title,
  priceMonthly,
  priceYearly,
  unit,
  features,
  highlighted,
  ctaSlot,
  footnote,
}: {
  badge?: string;
  title: string;
  priceMonthly: number;
  priceYearly: number;
  unit: string;
  features: string[];
  highlighted?: boolean;
  ctaSlot?: React.ReactNode;
  footnote?: string;
}) {
  const showYearly = true;
  const price = showYearly ? priceYearly : priceMonthly;
  const priceLabel =
    price === 0
      ? "0 kr/mån"
      : `${price.toLocaleString("sv-SE")} ${showYearly ? "kr/år" : unit}`;

  return (
    <Card className={highlighted ? "border-primary shadow-sm" : ""}>
      <CardHeader>
        {badge ? (
          <Badge variant={highlighted ? "default" : "secondary"} className="w-fit">
            {badge}
          </Badge>
        ) : null}
        <CardTitle className="mt-1">{title}</CardTitle>
        <div className="text-2xl font-bold">{priceLabel}</div>
        {showYearly && priceMonthly > 0 ? (
          <div className="text-xs text-muted-foreground">
            eller {priceMonthly.toLocaleString("sv-SE")} {unit} (månadsvis)
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <ul className="mb-6 space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {ctaSlot ?? (
          <Button asChild className="w-full">
            <Link href="/register">Börja</Link>
          </Button>
        )}

        {footnote ? (
          <p className="mt-3 text-xs text-muted-foreground">{footnote}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
