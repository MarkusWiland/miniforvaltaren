"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { LoadingButton } from "@/components/loading-button";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// ——— Validering ——————————————————————————————————————
const signInSchema = z.object({
  email: z.string().email({ message: "Ange en giltig e-postadress" }),
  password: z.string().min(1, { message: "Lösenord är obligatoriskt" }),
  rememberMe: z.boolean().optional(),
});

type SignInValues = z.infer<typeof signInSchema>;

// ——— Komponent ————————————————————————————————————————
export function SignInForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
    mode: "onTouched",
  });

  async function onSubmit({ email, password, rememberMe }: SignInValues) {
    setSubmitError(null);
    setSubmitting(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
      rememberMe,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message || "Något gick fel. Försök igen.");
      return;
    }

    toast.success("Inloggad! Välkommen tillbaka 👋");
    router.push(redirect);
  }

  async function handleSocialSignIn(provider: "google" | "github") {
    setSubmitError(null);
    setSubmitting(true);

    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: redirect,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message || "Kunde inte logga in just nu.");
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Logga in</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Ange dina uppgifter för att komma åt ditt konto.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      inputMode="email"
                      autoComplete="email"
                      placeholder="du@exempel.se"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lösenord + glömt */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>Lösenord</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="ml-auto inline-block text-sm underline"
                    >
                      Glömt lösenord?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput
                      autoComplete="current-password"
                      placeholder="Ditt lösenord"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kom ihåg mig */}
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Kom ihåg mig"
                    />
                  </FormControl>
                  <FormLabel className="mb-0">Kom ihåg mig</FormLabel>
                </FormItem>
              )}
            />

            {/* Serverfel */}
            {submitError && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {submitError}
              </div>
            )}

            {/* Primär CTA */}
            <LoadingButton type="submit" className="w-full" loading={submitting}>
              Logga in
            </LoadingButton>

            {/* Social logga in */}
            <div className="flex w-full flex-col gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={submitting}
                onClick={() => handleSocialSignIn("google")}
              >
                Fortsätt med Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={submitting}
                onClick={() => handleSocialSignIn("github")}
              >
                Fortsätt med GitHub
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <CardFooter>
        <div className="flex w-full justify-center border-t pt-4">
          <p className="text-muted-foreground text-center text-xs">
            Saknar du konto?{" "}
            <Link href="/sign-up" className="underline">
              Skapa konto
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
