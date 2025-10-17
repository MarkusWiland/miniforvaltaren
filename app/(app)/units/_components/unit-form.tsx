"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const Schema = z.object({
  propertyId: z.string().min(1, "Välj fastighet"),
  label: z.string().min(1, "Ange en label, t.ex. A-101"),
});

export function UnitForm({
  action,
  initialProperty,
  serverError,
}: {
  action: (fd: FormData) => Promise<void>;
  initialProperty: { id: string; name: string } | null;
  serverError?: string;
}) {
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      propertyId: initialProperty?.id ?? "",
      label: "",
    },
  });

  const [pending, startTransition] = React.useTransition();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          const fd = new FormData();
          fd.set("propertyId", values.propertyId);
          fd.set("label", values.label);
          startTransition(async () => {
            await action(fd);
          });
        })}
        className="space-y-6"
        noValidate
      >
        {/* Fastighet – om du redan har propertyId, gör fältet read-only */}
        <FormField
          control={form.control}
          name="propertyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fastighet</FormLabel>
              <FormControl>
                {initialProperty ? (
                  <Input value={`${initialProperty.name}`} readOnly className={cn("bg-muted/50")} />
                ) : (
                  <Input placeholder="Klistra in fastighets-ID (MVP) eller bygg en select" {...field} />
                )}
              </FormControl>
              {!initialProperty && <FormMessage />}
              {/* Om read-only: vi måste ändå skicka id:t */}
              {initialProperty && <input type="hidden" name="propertyId" value={initialProperty.id} />}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enhetslabel</FormLabel>
              <FormControl>
                <Input placeholder="Ex. A-101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError ? <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p> : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Sparar…" : "Spara enhet"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => history.back()} disabled={pending}>
            Avbryt
          </Button>
        </div>
      </form>
    </Form>
  );
}
