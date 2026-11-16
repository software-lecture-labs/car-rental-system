"use client";

import { useState, type KeyboardEvent } from "react";
import type { CarImageResponse } from "@/lib/api/types";
import { toBrowserPath } from "@/lib/api/urls";
import { CarImage } from "./CarImage";
import { CarPlaceholder } from "./CarPlaceholder";

/** Detay sayfası galerisi: büyük görsel + küçük resim şeridi. Ok tuşlarıyla gezilebilir. */
export function Gallery({ images, title }: { images: CarImageResponse[]; title: string }) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  if (count === 0) {
    return (
      <figure>
        <div className="aspect-[4/3] w-full border border-rule">
          <CarPlaceholder />
        </div>
        <figcaption className="mt-2 text-xs text-muted">Bu araç için henüz görsel eklenmemiş.</figcaption>
      </figure>
    );
  }

  const current = images[Math.min(index, count - 1)];
  const go = (next: number) => setIndex((next + count) % count);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(index + 1);
    if (event.key === "ArrowLeft") go(index - 1);
  };

  return (
    <figure aria-roledescription="galeri" aria-label={`${title} görselleri`}>
      <div
        tabIndex={count > 1 ? 0 : undefined}
        onKeyDown={onKeyDown}
        aria-label={count > 1 ? "Görseller arasında geçmek için sol ve sağ ok tuşlarını kullan" : undefined}
        className="relative border border-rule"
      >
        <CarImage src={toBrowserPath(current.url)} alt={`${title}, görsel ${index + 1} / ${count}`} fit="contain" className="aspect-[4/3] w-full" />
        <span className="figures absolute right-0 bottom-0 bg-white px-2 py-1 text-xs text-navy">
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </span>
      </div>
      {count > 1 ? (
        <ul className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label="Küçük resimler">
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Görsel ${i + 1}${image.cover ? " (kapak)" : ""}`}
                aria-current={i === index ? "true" : undefined}
                className={`block w-full border ${i === index ? "border-navy outline-1 outline-navy" : "border-rule hover:border-rule-strong"}`}
              >
                <CarImage src={toBrowserPath(image.url)} alt="" className="aspect-[4/3] w-full" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}
