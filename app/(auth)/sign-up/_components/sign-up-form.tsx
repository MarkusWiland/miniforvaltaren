"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { passwordSchema } from "@/lib/validation";

import { LoadingButton } from "@/components/loading-button";
import { PasswordInput } from "@/components/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// ——— Schema ————————————————————————————————————————————
const signUpSchema = z
  .object({
    name: z.string().min(1, { message: "Namn är obligatoriskt" }),
    email: z.string().email({ message: "Ange en giltig e-postadress" }),
    password: passwordSchema, // din befintliga lösenordsvalidering
    passwordConfirmation: z.string().min(1, { message: "Bekräfta ditt lösenord" }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Lösenorden matchar inte",
    path: ["passwordConfirmation"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

// ——— Komponent ————————————————————————————————————————————
export function SignUpForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
    mode: "onTouched",
  });

  const loading = form.formState.isSubmitting;

  async function onSubmit({ email, password, name }: SignUpValues) {
    setSubmitError(null);

    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: "/onboarding", // Direkt in i onboarding
    });

    if (error) {
      setSubmitError(error.message || "Något gick fel. Försök igen.");
      return;
    }

    toast.success("Konto skapat! Välkommen 👋");
    router.push("/onboarding");
  }

  return (
    <Card className="w-full max-w-md border-border/60">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Skapa konto</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Fyll i uppgifterna nedan för att börja med MiniFörvaltaren.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Namn */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Namn</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex. Anna Andersson"
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* E-post */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-post</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="du@exempel.se"
                      autoComplete="email"
                      inputMode="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lösenord */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lösenord</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Minst enligt kraven"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-[11px] text-muted-foreground">
                    Välj ett starkt lösenord. (Tips: minst 8 tecken, blandade typer)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bekräfta lösenord */}
            <FormField
              control={form.control}
              name="passwordConfirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bekräfta lösenord</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Upprepa lösenordet"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Serverfel */}
            {submitError && (
              <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <LoadingButton type="submit" className="w-full" loading={loading}>
              Skapa konto
            </LoadingButton>

            <p className="text-[11px] text-muted-foreground text-center">
              Genom att fortsätta godkänner du våra{" "}
              <Link href="/terms" className="underline">
                villkor
              </Link>{" "}
              och{" "}
              <Link href="/privacy" className="underline">
                integritetspolicy
              </Link>
              .
            </p>
          </form>
        </Form>
      </CardContent>

      <CardFooter>
        <div className="flex w-full justify-center border-t pt-4">
          <p className="text-muted-foreground text-center text-xs">
            Har du redan ett konto?{" "}
            <Link href="/sign-in" className="underline">
              Logga in
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
