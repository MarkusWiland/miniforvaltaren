// app/(app)/leases/_components/lease-form.tsx
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const Schema = z.object({
  propertyId: z.string().min(1, "Välj fastighet"),
  unitId: z.string().min(1, "Välj enhet"),
  tenantId: z.string().min(1, "Välj hyresgäst"),
  rentAmountKr: z.number().min(1, "Ange hyra i kronor").max(10_000_000, "Orimligt belopp"),
  dueDay: z.number().int().min(1).max(28, "Välj en dag 1–28"),
  startDate: z.string().min(1, "Välj startdatum"),
  endDate: z.string().optional().nullable(),
});

type PropertyDTO = {
  id: string;
  name: string;
  units: { id: string; label: string }[];
};

type TenantDTO = { id: string; name: string };

export function LeaseForm({
  action,
  data,
  serverError,
}: {
  action: (fd: FormData) => Promise<void>;
  data: {
    properties: PropertyDTO[];
    tenants: TenantDTO[];
    initialPropertyId?: string;
    initialUnitId?: string;
    initialTenantId?: string;
  };
  serverError?: string;
}) {
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      propertyId: data.initialPropertyId ?? "",
      unitId: data.initialUnitId ?? "",
      tenantId: data.initialTenantId ?? "",
      rentAmountKr: 0,
      dueDay: 1,
      startDate: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
      endDate: "",
    },
  });

  const [pending, startTransition] = React.useTransition();

  // Hämta units utifrån valt property
  const propertyId = form.watch("propertyId");
  const selectedProp = data.properties.find((p) => p.id === propertyId);
  const units = selectedProp?.units ?? [];

  // Nollställ unitId när property byts
  React.useEffect(() => {
    if (!units.find((u) => u.id === form.getValues("unitId"))) {
      form.setValue("unitId", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          const fd = new FormData();
          fd.set("propertyId", values.propertyId);
          fd.set("unitId", values.unitId);
          fd.set("tenantId", values.tenantId);
          fd.set("dueDay", String(values.dueDay));
          // kr → öre
          fd.set("rentAmount", String(Math.round(values.rentAmountKr * 100)));
          fd.set("startDate", values.startDate);
          if (values.endDate) fd.set("endDate", values.endDate);

          startTransition(async () => {
            await action(fd); // server action redirectar
          });
        })}
        className="space-y-6"
        noValidate
      >
        {/* Property */}
        <FormField
          control={form.control}
          name="propertyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fastighet</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Välj fastighet" /></SelectTrigger>
                  <SelectContent>
                    {data.properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Unit */}
        <FormField
          control={form.control}
          name="unitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enhet</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={!propertyId}>
                  <SelectTrigger><SelectValue placeholder={propertyId ? "Välj enhet" : "Välj fastighet först"} /></SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tenant */}
        <FormField
          control={form.control}
          name="tenantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hyresgäst</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Välj hyresgäst" /></SelectTrigger>
                  <SelectContent>
                    {data.tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Belopp (kr) */}
        <FormField
          control={form.control}
          name="rentAmountKr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hyra per månad (kr)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="1"
                  placeholder="t.ex. 8500"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v === "" ? undefined : Number(v));
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Due day */}
        <FormField
          control={form.control}
          name="dueDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Förfallodag (1–28)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  step="1"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v === "" ? undefined : Number(v));
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start/End */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Startdatum</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slutdatum (valfritt)</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {serverError ? <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p> : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara avtal"}</Button>
          <Button type="button" variant="ghost" onClick={() => history.back()} disabled={pending}>Avbryt</Button>
        </div>
      </form>
    </Form>
  );
}
