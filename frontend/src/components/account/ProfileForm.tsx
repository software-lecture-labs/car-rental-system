"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { clientApi } from "@/lib/api/client";
import type { CustomerResponse } from "@/lib/api/types";
import { errorMessage, fieldErrorsFrom } from "@/lib/messages";
import { currentYear, hasErrors, requireText, validateLicenseYear, type Errors } from "@/lib/validation";
import { Field, TextInput } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";

type Key = "firstName" | "lastName" | "licenseYear";

/** PUT /api/customers/{id}: ad, soyad, ehliyet yılı. E-posta giriş bilgisi olduğu için salt okunur. */
export function ProfileForm({ customer }: { customer: CustomerResponse }) {
  const router = useRouter();
  const [values, setValues] = useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    licenseYear: String(customer.licenseYear),
  });
  const [errors, setErrors] = useState<Errors<Key>>({});
  const [status, setStatus] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const changed =
    values.firstName.trim() !== customer.firstName ||
    values.lastName.trim() !== customer.lastName ||
    values.licenseYear.trim() !== String(customer.licenseYear);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors<Key> = {
      firstName: requireText(values.firstName, "Ad", 50),
      lastName: requireText(values.lastName, "Soyad", 50),
      licenseYear: validateLicenseYear(values.licenseYear),
    };
    setErrors(found);
    setStatus(null);
    if (hasErrors(found)) return;

    startTransition(async () => {
      try {
        await clientApi.customers.update(customer.id, {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          licenseYear: Number(values.licenseYear),
        });
        setStatus({ tone: "ok", text: "Bilgilerin kaydedildi." });
        router.refresh();
      } catch (error) {
        setErrors(
          fieldErrorsFrom(error, {
            firstName: "Ad 1–50 karakter olmalı.",
            lastName: "Soyad 1–50 karakter olmalı.",
            licenseYear: "Ehliyet yılı geçerli değil.",
          }),
        );
        setStatus({ tone: "err", text: errorMessage(error, "profile") });
      }
    });
  }

  const set = (key: Key) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setStatus(null);
  };

  return (
    <form noValidate onSubmit={onSubmit} className="max-w-2xl space-y-5">
      {status ? <Notice tone={status.tone} title={status.text} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="firstName" label="Adı" code="01" error={errors.firstName}>
          <TextInput id="firstName" autoComplete="given-name" maxLength={50} value={values.firstName} onChange={set("firstName")} error={errors.firstName} />
        </Field>
        <Field id="lastName" label="Soyadı" code="02" error={errors.lastName}>
          <TextInput id="lastName" autoComplete="family-name" maxLength={50} value={values.lastName} onChange={set("lastName")} error={errors.lastName} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="email" label="E-posta" code="03" hint="Giriş bilgisi; değiştirilemez.">
          <TextInput id="email" type="email" value={customer.email} readOnly hint />
        </Field>
        <Field id="licenseYear" label="Ehliyet alış yılı" code="04" error={errors.licenseYear} hint={`1950 – ${currentYear()}`}>
          <TextInput id="licenseYear" inputMode="numeric" maxLength={4} className="figures" value={values.licenseYear} onChange={set("licenseYear")} error={errors.licenseYear} hint />
        </Field>
      </div>
      <div className="border-t border-rule pt-5">
        <button type="submit" className={buttonClass("primary")} disabled={pending || !changed}>
          {pending ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
        </button>
      </div>
    </form>
  );
}
