"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { clientApi, login } from "@/lib/api/client";
import { conflictKind, errorMessage, fieldErrorsFrom } from "@/lib/messages";
import {
  currentYear,
  hasErrors,
  requireText,
  validateEmail,
  validateLicenseYear,
  validatePassword,
  type Errors,
} from "@/lib/validation";
import { Field, TextInput } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";

type Key = "firstName" | "lastName" | "email" | "password" | "passwordAgain" | "licenseYear";

const SERVER_FIELD_MESSAGES: Record<string, string> = {
  firstName: "Ad 1–50 karakter olmalı.",
  lastName: "Soyad 1–50 karakter olmalı.",
  email: "Geçerli bir e-posta adresi yaz.",
  password: "Şifre 8–72 karakter olmalı.",
  licenseYear: "Ehliyet yılı geçerli değil.",
};

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<Key, string>>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordAgain: "",
    licenseYear: "",
  });
  const [errors, setErrors] = useState<Errors<Key>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (key: Key) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors<Key> = {
      firstName: requireText(values.firstName, "Ad", 50),
      lastName: requireText(values.lastName, "Soyad", 50),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      passwordAgain:
        values.passwordAgain !== values.password ? "Şifreler aynı değil." : undefined,
      licenseYear: validateLicenseYear(values.licenseYear),
    };
    setErrors(found);
    setFormError(null);
    setEmailTaken(false);
    if (hasErrors(found)) return;

    startTransition(async () => {
      const email = values.email.trim();
      try {
        await clientApi.customers.register({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email,
          password: values.password,
          licenseYear: Number(values.licenseYear),
        });
      } catch (error) {
        if (conflictKind(error) === "duplicate") setEmailTaken(true);
        setErrors(fieldErrorsFrom(error, SERVER_FIELD_MESSAGES));
        setFormError(errorMessage(error, "register"));
        return;
      }
      try {
        await login({ email, password: values.password });
        router.replace(next || "/hesabim");
        router.refresh();
      } catch {
        // Kayıt oldu ama otomatik giriş olmadı: giriş sayfasına yönlendir.
        router.replace(`/giris${next ? `?next=${encodeURIComponent(next)}` : ""}`);
      }
    });
  }

  const year = currentYear();

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {formError ? (
        <Notice tone="err" title={formError}>
          {emailTaken ? (
            <>
              Bu adresle daha önce kayıt olduysan <Link href={`/giris${next ? `?next=${encodeURIComponent(next)}` : ""}`}>giriş yap</Link>.
            </>
          ) : null}
        </Notice>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="firstName" label="Adı" code="01" error={errors.firstName}>
          <TextInput id="firstName" autoComplete="given-name" maxLength={50} value={values.firstName} onChange={set("firstName")} error={errors.firstName} />
        </Field>
        <Field id="lastName" label="Soyadı" code="02" error={errors.lastName}>
          <TextInput id="lastName" autoComplete="family-name" maxLength={50} value={values.lastName} onChange={set("lastName")} error={errors.lastName} />
        </Field>
      </div>
      <Field id="email" label="E-posta" code="03" error={errors.email} hint="Giriş için kullanılır, sonradan değiştirilemez.">
        <TextInput id="email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={set("email")} error={errors.email} hint />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="password" label="Şifre" code="04" error={errors.password} hint="8–72 karakter.">
          <TextInput id="password" type="password" autoComplete="new-password" value={values.password} onChange={set("password")} error={errors.password} hint />
        </Field>
        <Field id="passwordAgain" label="Şifre (tekrar)" code="05" error={errors.passwordAgain}>
          <TextInput id="passwordAgain" type="password" autoComplete="new-password" value={values.passwordAgain} onChange={set("passwordAgain")} error={errors.passwordAgain} />
        </Field>
      </div>
      <Field id="licenseYear" label="Ehliyet alış yılı" code="06" error={errors.licenseYear} hint={`1950 – ${year}`}>
        <TextInput
          id="licenseYear"
          inputMode="numeric"
          autoComplete="off"
          placeholder={String(year - 5)}
          maxLength={4}
          className="figures max-w-40"
          value={values.licenseYear}
          onChange={set("licenseYear")}
          error={errors.licenseYear}
          hint
        />
      </Field>

      <div className="flex flex-wrap items-center gap-4 border-t border-rule pt-5">
        <button type="submit" className={buttonClass("primary", "lg")} disabled={pending}>
          {pending ? "Kaydediliyor…" : "Hesap oluştur"}
        </button>
        <p className="text-sm text-muted">
          Zaten hesabın var mı?{" "}
          <Link href={`/giris${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-navy underline underline-offset-4">
            Giriş yap
          </Link>
        </p>
      </div>
    </form>
  );
}
