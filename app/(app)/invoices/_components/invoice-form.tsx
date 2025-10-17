// app/(app)/invoices/_components/invoice-form.tsx
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { createInvoiceAction } from "../actions/action";


const Schema = z.object({
  leaseId: z.string().min(1, "Välj avtal"),
  amountKr: z.coerce.number().min(1, "Ange belopp i kronor").max(10_000_000, "Orimligt belopp"),
  dueDate: z.string().min(1, "Välj förfallodatum"),
});

type InvoiceFormInput = z.input<typeof Schema>;
type InvoiceFormValues = z.output<typeof Schema>;

export function InvoiceForm({
  data,
  serverError,
}: {
  data: {
    leases: { id: string; label: string }[];
    initialLeaseId?: string;
    defaultAmountKr?: number;
  };
  serverError?: string;
}) {
  const form = useForm<InvoiceFormInput, any, InvoiceFormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      leaseId: data.initialLeaseId ?? "",
      amountKr: data.defaultAmountKr ?? 0,
      dueDate: new Date().toISOString().slice(0, 10),
    },
  });

  const [pending, startTransition] = React.useTransition();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          const fd = new FormData();
          fd.set("leaseId", values.leaseId);
          fd.set("amount", String(Math.round(values.amountKr * 100))); // kr → öre
          fd.set("dueDate", values.dueDate);

          startTransition(async () => {
            await createInvoiceAction(fd);
          });
        })}
        className="space-y-6"
        noValidate
      >
        {/* Avtal */}
        <FormField
          control={form.control}
          name="leaseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avtal</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Välj avtal (hyresgäst • fastighet/enhet)" /></SelectTrigger>
                  <SelectContent>
                    {data.leases.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Belopp */}
        <FormField
          control={form.control}
          name="amountKr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Belopp (kr)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="1"
                  placeholder="t.ex. 8500"
                  {...field}
                  value={
                    (typeof field.value === "number" || typeof field.value === "string")
                      ? field.value
                      : ""
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Förfallodatum */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Förfallodatum</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
        ) : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Sparar…" : "Spara avi"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => history.back()} disabled={pending}>
            Avbryt
          </Button>
        </div>
      </form>
    </Form>
  );
}
