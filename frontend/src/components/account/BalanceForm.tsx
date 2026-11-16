"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { clientApi } from "@/lib/api/client";
import { formatTL } from "@/lib/format";
import { errorMessage } from "@/lib/messages";
import { parseMoney, validateMoney } from "@/lib/validation";
import { Field, TextInput } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";

const QUICK = [500, 1000, 2500, 5000];
// balance NUMERIC(12,2): tek yüklemeyi makul bir üst sınırda tutuyoruz
const MAX_LOAD = 1_000_000;

/** PUT /api/customers/{id}/balance?amount=… */
export function BalanceForm({
  customerId,
  required,
  next,
}: {
  customerId: string;
  required: number | null;
  next: string | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(required ? required.toFixed(2).replace(".", ",") : "");
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validateMoney(amount, "Tutar", { max: MAX_LOAD });
    setError(problem);
    setResult(null);
    if (problem) return;
    const parsed = parseMoney(amount)!;

    startTransition(async () => {
      try {
        await clientApi.customers.loadBalance(customerId, parsed.text);
        setResult({ tone: "ok", text: `${formatTL(parsed.value)} bakiyene eklendi.` });
        setLoaded(true);
        setAmount("");
        router.refresh();
      } catch (e) {
        setResult({ tone: "err", text: errorMessage(e, "balance") });
      }
    });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="max-w-xl space-y-5">
      {result ? (
        <Notice tone={result.tone} title={result.text}>
          {result.tone === "ok" && next ? (
            <Link href={next} className={buttonClass("reserve", "md", "mt-3 no-underline! text-navy!")}>
              Rezervasyona dön
            </Link>
          ) : null}
        </Notice>
      ) : null}

      <Field id="amount" label="Yüklenecek tutar (TL)" code="01" error={error} hint="Kuruşlu tutar için virgül kullan: 1250,50">
        <TextInput
          id="amount"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          className="figures max-w-60 text-lg"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setLoaded(false);
          }}
          error={error}
          hint
        />
      </Field>

      <div>
        <p className="doc-label mb-2">Hızlı seçim</p>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((value) => (
            <button key={value} type="button" className={buttonClass("outline", "sm", "figures")} onClick={() => setAmount(String(value))}>
              {formatTL(value)}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-rule pt-5">
        <button type="submit" className={buttonClass("primary")} disabled={pending || (loaded && !amount)}>
          {pending ? "Yükleniyor…" : "Bakiyeye ekle"}
        </button>
      </div>
    </form>
  );
}
