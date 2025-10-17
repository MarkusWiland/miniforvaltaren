// ------- Client form (shadcn + RHF + Zod) ------- //
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(2, "Ange ett namn (minst 2 tecken)"),
  address: z.string().min(5, "Ange en adress (minst 5 tecken)"),
});

export function PropertyForm({
  action,        // server action: (fd: FormData) => Promise<void>
  serverError,
}: {
  action: (formData: FormData) => Promise<void>;
  serverError?: string;
}) {
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", address: "" },
    mode: "onSubmit",
  });

  const [pending, startTransition] = React.useTransition();

  return (
    <Form {...form}>
      <form
        // ❌ ta bort: action={...} – vi submit:ar manuellt nedan
        onSubmit={form.handleSubmit((values) => {
          const fd = new FormData();
          fd.set("name", values.name);
          fd.set("address", values.address);
          startTransition(async () => {
            await action(fd); // server action redirectar vid success
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
                <Input placeholder="Ex. Storgatan 12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adress</FormLabel>
              <FormControl>
                <Input placeholder="Storgatan 12, 411 00 Göteborg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
        ) : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Sparar…" : "Spara fastighet"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => history.back()} disabled={pending}>
            Avbryt
          </Button>
        </div>
      </form>
    </Form>
  );
}
