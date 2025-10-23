// app/(public)/report/sent/page.tsx
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export const metadata = {
  title: "Felanmälan skickad",
  description: "Tack för att du rapporterade felet.",
};

export default function ReportSentPage({
  searchParams,
}: {
  searchParams?: { ticketId?: string };
}) {
  const ticketId = searchParams?.ticketId;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-3">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Tack för din felanmälan!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Din rapport har skickats till fastighetsägaren. Du kommer få svar
            via e-post när ärendet hanteras.
          </p>
          <p>Vanligtvis får du återkoppling inom 1–3 arbetsdagar.</p>

          {ticketId && (
            <div className="pt-2">
              <p className="text-xs">
                <span className="text-muted-foreground">Ärendenummer:</span>{" "}
                <span className="font-mono text-foreground">{ticketId}</span>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/">Till startsidan</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Har du fler fel att rapportera? Skanna QR-koden igen eller använd
            samma länk.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
