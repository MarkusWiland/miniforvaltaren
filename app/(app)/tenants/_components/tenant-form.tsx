// app/(app)/tenants/_components/tenant-form.tsx
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const Schema = z.object({
  name: z.string().min(2, "Ange namn"),
  email: z.string().email("Ogiltig e-post").optional().or(z.literal("")),
  phone: z.string().min(6, "Ogiltigt nummer").optional().or(z.literal("")),
});

type TenantFormValues = z.infer<typeof Schema>;

export function TenantForm({
  action,
  serverError,
}: {
  action: (fd: FormData) => Promise<void>;
  serverError?: string;
}) {
  const form = useForm<TenantFormValues, any, TenantFormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const [pending, startTransition] = React.useTransition();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          const fd = new FormData();
          fd.set("name", values.name);
          if (values.email) fd.set("email", values.email);
          if (values.phone) fd.set("phone", values.phone);
          startTransition(async () => {
            await action(fd);
          });
        })}
        className="space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Namn</FormLabel>
              <FormControl>
                <Input placeholder="För- och efternamn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-post (valfritt)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="exempel@domän.se" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon (valfritt)</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="07x-xxx xx xx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {serverError ? <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p> : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>{pending ? "Sparar…" : "Spara hyresgäst"}</Button>
          <Button type="button" variant="ghost" onClick={() => history.back()} disabled={pending}>Avbryt</Button>
        </div>
      </form>
    </Form>
  );
}
