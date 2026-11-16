"use client";

import { useCallback, useState } from "react";
import { CarPlaceholder } from "./CarPlaceholder";

type LoadState = "loading" | "loaded" | "failed";

/**
 * Araç görseli. Görsel yoksa (kapak adresi 404 döner) ya da yüklenemezse yer tutucu SVG görünür.
 * Görseller backend'den Next üzerinden zaten önbellek başlıklarıyla geliyor; next/image optimizasyonu
 * bir şey kazandırmadığı için düz <img> kullanıyoruz.
 */
export function CarImage({
  src,
  alt,
  className = "",
  fit = "cover",
}: {
  src: string;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const [state, setState] = useState<{ src: string; value: LoadState }>({ src, value: "loading" });
  const current = state.src === src ? state.value : "loading";

  // Sayfa hidrasyondan önce yüklendiyse onLoad/onError kaçabilir; ref ile mevcut durumu oku.
  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img || !img.complete) return;
      setState({ src, value: img.naturalWidth > 0 ? "loaded" : "failed" });
    },
    [src],
  );

  return (
    <div className={`relative overflow-hidden bg-card ${className}`}>
      {current !== "loaded" ? (
        <div className="absolute inset-0">
          <CarPlaceholder label={current === "loading" ? "" : "GÖRSEL YOK"} />
        </div>
      ) : null}
      {current !== "failed" ? (
        // eslint-disable-next-line @next/next/no-img-element -- bkz. bileşen açıklaması
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState({ src, value: "loaded" })}
          onError={() => setState({ src, value: "failed" })}
          className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${
            fit === "cover" ? "object-cover" : "object-contain"
          } ${current === "loaded" ? "opacity-100" : "opacity-0"}`}
        />
      ) : null}
    </div>
  );
}
