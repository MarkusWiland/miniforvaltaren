// app/(public)/report/[token]/report-form.tsx
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
import { publicCreateTicketAction } from "../actions/action";

const Schema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().optional().or(z.literal("")),
  title: z.string().min(3, "Ange en titel"),
  description: z.string().min(5, "Beskriv problemet"),
  name: z.string().optional(),
  email: z.string().email("Ogiltig e-post").optional().or(z.literal("")),
  phone: z.string().optional(),
});

type Values = z.infer<typeof Schema>;

export function PublicReportForm({
  propertyId,
  units,
}: {
  propertyId: string;
  units: { id: string; label: string }[];
}) {
  const form = useForm<Values, any, Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      propertyId,
      unitId: "",
      title: "",
      description: "",
      name: "",
      email: "",
      phone: "",
    },
  });
  const [pending, startTransition] = React.useTransition();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => {
          const fd = new FormData();
          Object.entries(v).forEach(
            ([k, val]) => val != null && fd.set(k, String(val))
          );
          startTransition(async () => {
            await publicCreateTicketAction(fd);
          });
        })}
        className="space-y-4"
        noValidate
      >
        <FormField
          name="unitId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lägenhet/Enhet (valfritt)</FormLabel>
              <FormControl>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj enhet (om du vet)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Okänt/Annat</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="title"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titel</FormLabel>
              <FormControl>
                <Input placeholder="Ex. Trasig blandare i köket" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivning</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Beskriv felet så tydligt du kan…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Namn (valfritt)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-post (valfritt)</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="phone"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon (valfritt)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* hidden propertyId */}
        <input type="hidden" name="propertyId" value={propertyId} />

        <div className="pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Skickar…" : "Skicka felanmälan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
