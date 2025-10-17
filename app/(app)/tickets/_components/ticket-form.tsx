// app/(app)/tickets/_components/ticket-form.tsx
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const Schema = z.object({
  title: z.string().min(3, "Ange en titel"),
  description: z.string().optional(),
  tenantId: z.string().optional().or(z.literal("")),
});

type TicketFormValues = z.infer<typeof Schema>;

export function TicketForm({
  action,
  data,
  serverError,
  initial,
}: {
  action: (fd: FormData) => Promise<void>;
  data: { tenants: { id: string; name: string }[]; initialTenantId?: string };
  serverError?: string;
  initial?: {
    ticketId?: string;
    title?: string;
    description?: string;
    tenantId?: string;
  };
}) {
  const form = useForm<TicketFormValues, any, TicketFormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      tenantId: initial?.tenantId ?? data.initialTenantId ?? "",
    },
  });

  const [pending, startTransition] = React.useTransition();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          const fd = new FormData();
          if (initial?.ticketId) fd.set("ticketId", initial.ticketId);
          fd.set("title", values.title);
          if (values.description) fd.set("description", values.description);
          if (values.tenantId) fd.set("tenantId", values.tenantId);

          startTransition(async () => {
            await action(fd);
          });
        })}
        className="space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titel</FormLabel>
              <FormControl>
                <Input placeholder="Kort titel…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivning (valfritt)</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Beskriv problemet…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tenantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hyresgäst (valfritt)</FormLabel>
              <FormControl>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Koppla hyresgäst (valfritt)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ingen">Ingen</SelectItem>
                    {data.tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {serverError}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending}>
            {pending
              ? "Sparar…"
              : initial?.ticketId
              ? "Spara ändringar"
              : "Skapa ärende"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => history.back()}
            disabled={pending}
          >
            Avbryt
          </Button>
        </div>
      </form>
    </Form>
  );
}
