"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { clientApi } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { CustomerResponse } from "@/lib/api/types";
import { formatTL } from "@/lib/format";
import { errorMessage } from "@/lib/messages";
import { validateEmail, validateInteger } from "@/lib/validation";
import { ledger } from "./ledger";

type Mode = "firstname" | "email" | "licenseyear";

const MODES: Record<Mode, { label: string; placeholder: string }> = {
  firstname: { label: "Ada göre", placeholder: "ör. Ayşe" },
  email: { label: "E-postaya göre", placeholder: "ad@ornek.com" },
  licenseyear: { label: "Ehliyet yılına göre", placeholder: "ör. 2015" },
};

/** Müşteri listesi, arama (ad / e-posta / ehliyet yılı) ve silme. */
export function CustomerAdmin({ customers }: { customers: CustomerResponse[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("firstname");
  const [query, setQuery] = useState("");
  const [queryError, setQueryError] = useState<string>();
  const [results, setResults] = useState<CustomerResponse[] | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err" | "info"; text: string } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    const problem =
      mode === "email" ? validateEmail(q) : mode === "licenseyear" ? validateInteger(q, "Ehliyet yılı", 1950, 2100) : q ? undefined : "Aranacak adı yaz.";
    setQueryError(problem);
    setMessage(null);
    if (problem) return;

    startTransition(async () => {
      try {
        const found =
          mode === "firstname"
            ? await clientApi.customers.searchByFirstName(q)
            : mode === "licenseyear"
              ? await clientApi.customers.searchByLicenseYear(Number(q))
              : [await clientApi.customers.byEmail(q)];
        setResults(found);
      } catch (error) {
        if (isApiError(error) && error.status === 404) setResults([]);
        else setMessage({ tone: "err", text: errorMessage(error, "customer-search") });
      }
    });
  }

  function remove(customer: CustomerResponse) {
    startTransition(async () => {
      try {
        await clientApi.customers.remove(customer.id);
        setDeleted((d) => new Set(d).add(customer.id));
        setConfirmId(null);
        setMessage({ tone: "ok", text: `${customer.firstName} ${customer.lastName} silindi.` });
        router.refresh();
      } catch (error) {
        setConfirmId(null);
        setMessage({ tone: "err", text: errorMessage(error, "customer-delete") });
      }
    });
  }

  const rows = (results ?? customers).filter((c) => !deleted.has(c.id));

  return (
    <div className="space-y-4">
      <form noValidate onSubmit={onSearch} className="grid gap-3 sm:grid-cols-[14rem_minmax(0,22rem)_auto_auto] sm:items-end">
        <Field id="mod" label="Arama türü">
          <SelectInput id="mod" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            {(Object.keys(MODES) as Mode[]).map((m) => (
              <option key={m} value={m}>
                {MODES[m].label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field id="q" label="Aranan" error={queryError}>
          <TextInput id="q" type="search" value={query} placeholder={MODES[mode].placeholder} onChange={(e) => setQuery(e.target.value)} error={queryError} />
        </Field>
        <button type="submit" className={buttonClass("primary", "md", "h-11!")} disabled={pending}>
          Ara
        </button>
        {results ? (
          <button
            type="button"
            className={buttonClass("outline", "md", "h-11!")}
            onClick={() => {
              setResults(null);
              setQuery("");
            }}
          >
            Bütün müşteriler
          </button>
        ) : null}
      </form>

      {message ? <Notice tone={message.tone} title={message.text} /> : null}

      <p className="figures text-xs text-muted">
        {results ? `ARAMA SONUCU · ${rows.length} KAYIT` : `${rows.length} MÜŞTERİ`}
      </p>

      {rows.length === 0 ? (
        <p className="border-t border-navy py-6 text-sm text-muted">{results ? "Aramaya uyan müşteri yok." : "Kayıtlı müşteri yok."}</p>
      ) : (
        <div className={ledger.wrap}>
          <table className={ledger.table}>
            <caption className="sr-only">Müşteriler</caption>
            <thead>
              <tr>
                <th scope="col" className={ledger.th}>Ad soyad</th>
                <th scope="col" className={ledger.th}>E-posta</th>
                <th scope="col" className={ledger.thNum}>Ehliyet yılı</th>
                <th scope="col" className={ledger.thNum}>Bakiye</th>
                <th scope="col" className={ledger.th}><span className="sr-only">İşlemler</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={ledger.tr}>
                  <th scope="row" className={`${ledger.td} text-left font-medium text-navy`}>
                    {c.firstName} {c.lastName}
                  </th>
                  <td className={ledger.tdMono}>{c.email}</td>
                  <td className={ledger.tdNum}>{c.licenseYear}</td>
                  <td className={ledger.tdNum}>{formatTL(c.balance)}</td>
                  <td className={`${ledger.td} text-right whitespace-nowrap`}>
                    {confirmId === c.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs font-semibold text-err">Silinsin mi?</span>
                        <button type="button" className={buttonClass("danger", "sm")} disabled={pending} onClick={() => remove(c)}>
                          Evet, sil
                        </button>
                        <button type="button" className={buttonClass("quiet", "sm")} onClick={() => setConfirmId(null)}>
                          Vazgeç
                        </button>
                      </span>
                    ) : (
                      <button type="button" className={buttonClass("danger", "sm")} onClick={() => setConfirmId(c.id)}>
                        Sil<span className="sr-only">: {c.firstName} {c.lastName}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
