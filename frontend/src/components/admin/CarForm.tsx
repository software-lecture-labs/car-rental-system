"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { clientApi } from "@/lib/api/client";
import { FUEL_TYPES, TRANSMISSION_TYPES, type CarResponse, type FuelType, type TransmissionType } from "@/lib/api/types";
import { formatPlate, isValidPlate, normalizePlate } from "@/lib/format";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import { conflictKind, errorMessage, fieldErrorsFrom } from "@/lib/messages";
import { currentYear, hasErrors, parseMoney, requireText, validateInteger, validateMoney, type Errors } from "@/lib/validation";
import { Field, SelectInput, TextInput } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";

type Key = "brand" | "model" | "productionYear" | "fuelType" | "transmission" | "color" | "plate" | "seatCount" | "dailyBasePrice";

const SERVER_FIELD_MESSAGES: Record<string, string> = {
  brand: "Marka 1–50 karakter olmalı.",
  model: "Model 1–50 karakter olmalı.",
  productionYear: "Üretim yılı 1950–2100 arasında olmalı.",
  fuelType: "Yakıt türü seç.",
  transmission: "Vites türü seç.",
  color: "Renk 1–30 karakter olmalı.",
  plate: "Plaka biçimi geçersiz (ör. 34 ABC 123).",
  seatCount: "Koltuk sayısı 1–20 arasında olmalı.",
  dailyBasePrice: "Günlük fiyat sıfırdan büyük olmalı, en fazla 2 ondalık.",
};

/**
 * Araç ekleme (POST /api/cars) ve düzenleme (PUT /api/cars/{id}). Düzenlemede plaka ve durum değişmez.
 * Bazı eski DTO'larda eksik sayı alanı anlamsız hata döndürdüğü için bütün zorunlu alanları burada denetliyoruz.
 */
export function CarForm({ car }: { car?: CarResponse }) {
  const router = useRouter();
  const editing = Boolean(car);
  const [values, setValues] = useState<Record<Key, string>>({
    brand: car?.brand ?? "",
    model: car?.model ?? "",
    productionYear: car ? String(car.productionYear) : "",
    fuelType: car?.fuelType ?? "",
    transmission: car?.transmission ?? "",
    color: car?.color ?? "",
    plate: car ? formatPlate(car.plate) : "",
    seatCount: car ? String(car.seatCount) : "5",
    dailyBasePrice: car ? car.dailyBasePrice.toFixed(2).replace(".", ",") : "",
  });
  const [errors, setErrors] = useState<Errors<Key>>({});
  const [status, setStatus] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (key: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setStatus(null);
  };

  function validate(): Errors<Key> {
    return {
      brand: requireText(values.brand, "Marka", 50),
      model: requireText(values.model, "Model", 50),
      productionYear: validateInteger(values.productionYear, "Üretim yılı", 1950, currentYear() + 1),
      fuelType: values.fuelType ? undefined : "Yakıt türü seç.",
      transmission: values.transmission ? undefined : "Vites türü seç.",
      color: requireText(values.color, "Renk", 30),
      plate: editing ? undefined : !values.plate.trim() ? "Plaka boş bırakılamaz." : isValidPlate(values.plate) ? undefined : "Plaka biçimi geçersiz. Örnek: 34 ABC 123 (2 rakam, 1–3 harf, 2–4 rakam).",
      seatCount: validateInteger(values.seatCount, "Koltuk sayısı", 1, 20),
      dailyBasePrice: validateMoney(values.dailyBasePrice, "Günlük fiyat", { max: 99_999_999.99 }),
    };
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setStatus(null);
    if (hasErrors(found)) return;

    const body = {
      brand: values.brand.trim(),
      model: values.model.trim(),
      productionYear: Number(values.productionYear),
      fuelType: values.fuelType as FuelType,
      transmission: values.transmission as TransmissionType,
      color: values.color.trim(),
      seatCount: Number(values.seatCount),
      dailyBasePrice: parseMoney(values.dailyBasePrice)!.value,
    };

    startTransition(async () => {
      try {
        if (car) {
          await clientApi.cars.update(car.id, body);
          setStatus({ tone: "ok", text: "Araç bilgileri kaydedildi." });
          router.refresh();
        } else {
          const created = await clientApi.cars.create({ ...body, plate: normalizePlate(values.plate) });
          router.push(`/admin/araclar/${created.id}?yeni=1`);
        }
      } catch (error) {
        const fields = fieldErrorsFrom(error, SERVER_FIELD_MESSAGES);
        if (conflictKind(error) === "duplicate") fields.plate = "Bu plakayla kayıtlı bir araç zaten var.";
        setErrors(fields);
        setStatus({ tone: "err", text: errorMessage(error, "car-save") });
      }
    });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {status ? <Notice tone={status.tone} title={status.text} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="plate" label="Plaka" code="A" error={errors.plate} hint={editing ? "Plaka aracın kimliği; değiştirilemez." : "Örnek: 34 ABC 123"}>
          <TextInput
            id="plate"
            value={values.plate}
            onChange={set("plate")}
            readOnly={editing}
            autoCapitalize="characters"
            className="figures uppercase"
            error={errors.plate}
            hint
          />
        </Field>
        <Field id="brand" label="Markası" code="D.1" error={errors.brand}>
          <TextInput id="brand" maxLength={50} value={values.brand} onChange={set("brand")} error={errors.brand} />
        </Field>
        <Field id="model" label="Ticari adı" code="D.3" error={errors.model}>
          <TextInput id="model" maxLength={50} value={values.model} onChange={set("model")} error={errors.model} />
        </Field>
        <Field id="productionYear" label="Model yılı" code="D.4" error={errors.productionYear}>
          <TextInput id="productionYear" inputMode="numeric" maxLength={4} className="figures" value={values.productionYear} onChange={set("productionYear")} error={errors.productionYear} />
        </Field>
        <Field id="fuelType" label="Yakıt cinsi" code="P.3" error={errors.fuelType}>
          <SelectInput id="fuelType" value={values.fuelType} onChange={set("fuelType")} error={errors.fuelType}>
            <option value="">Seç…</option>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {FUEL_LABELS[f]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field id="transmission" label="Vites" error={errors.transmission}>
          <SelectInput id="transmission" value={values.transmission} onChange={set("transmission")} error={errors.transmission}>
            <option value="">Seç…</option>
            {TRANSMISSION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TRANSMISSION_LABELS[t]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field id="color" label="Rengi" code="R" error={errors.color}>
          <TextInput id="color" maxLength={30} value={values.color} onChange={set("color")} error={errors.color} />
        </Field>
        <Field id="seatCount" label="Koltuk sayısı" code="S.1" error={errors.seatCount}>
          <TextInput id="seatCount" inputMode="numeric" maxLength={2} className="figures" value={values.seatCount} onChange={set("seatCount")} error={errors.seatCount} />
        </Field>
        <Field id="dailyBasePrice" label="Günlük fiyat (TL)" error={errors.dailyBasePrice} hint={editing ? "Mevcut kiralamaları etkilemez." : undefined}>
          <TextInput id="dailyBasePrice" inputMode="decimal" placeholder="0,00" className="figures" value={values.dailyBasePrice} onChange={set("dailyBasePrice")} error={errors.dailyBasePrice} hint={editing} />
        </Field>
      </div>
      <div className="flex gap-3 border-t border-rule pt-5">
        <button type="submit" className={buttonClass("primary")} disabled={pending}>
          {pending ? "Kaydediliyor…" : editing ? "Değişiklikleri kaydet" : "Aracı ekle"}
        </button>
      </div>
    </form>
  );
}
