"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { login } from "@/lib/api/client";
import { errorMessage } from "@/lib/messages";
import { hasErrors, validateEmail, type Errors } from "@/lib/validation";
import { Field, TextInput } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";

type Key = "email" | "password";

export function LoginForm({ next, expired }: { next: string; expired: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors<Key>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors<Key> = {
      email: validateEmail(email),
      password: password ? undefined : "Şifre boş bırakılamaz.",
    };
    setErrors(found);
    setFormError(null);
    if (hasErrors(found)) return;

    startTransition(async () => {
      try {
        const user = await login({ email: email.trim(), password });
        const fallback = user.role === "ADMIN" ? "/admin" : "/hesabim";
        // Admin'i müşteri sayfasına (ya da tersini) geri göndermeyelim
        const target = next && !(user.role === "ADMIN" && next.startsWith("/hesabim")) && !(user.role !== "ADMIN" && next.startsWith("/admin")) ? next : fallback;
        router.replace(target);
        router.refresh();
      } catch (error) {
        setFormError(errorMessage(error, "login"));
      }
    });
  }

  const registerHref = next ? `/kayit?next=${encodeURIComponent(next)}` : "/kayit";

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {expired ? (
        <Notice tone="warn" title="Oturumun sona erdi.">
          Devam etmek için yeniden giriş yap; kaldığın sayfaya döneceksin.
        </Notice>
      ) : null}
      {formError ? <Notice tone="err" title={formError} /> : null}

      <Field id="email" label="E-posta" code="01" error={errors.email}>
        <TextInput
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
      </Field>
      <Field id="password" label="Şifre" code="02" error={errors.password}>
        <TextInput
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4 border-t border-rule pt-5">
        <button type="submit" className={buttonClass("primary", "lg")} disabled={pending}>
          {pending ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
        <p className="text-sm text-muted">
          Hesabın yok mu?{" "}
          <Link href={registerHref} className="font-semibold text-navy underline underline-offset-4">
            Kayıt ol
          </Link>
        </p>
      </div>
    </form>
  );
}
