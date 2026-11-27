"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { CarImage } from "@/components/car/CarImage";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { clientApi } from "@/lib/api/client";
import { MAX_IMAGES_PER_CAR, type CarImageResponse } from "@/lib/api/types";
import { toBrowserPath } from "@/lib/api/urls";
import { formatBytes } from "@/lib/format";
import { checkImages, type Checked } from "@/lib/images";
import { errorMessage } from "@/lib/messages";

type Picked = { name: string; size: number; head: Uint8Array; file: File };

const TYPE_LABEL: Record<string, string> = { "image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP" };

/**
 * Araç görselleri: çoklu yükleme (alan adı "files"), kapak seçme, silme.
 * 10 görsel ve 5 MB sınırı ile dosya türü yüklemeden önce kontrol edilir.
 */
export function ImageManager({ carId, initial }: { carId: string; initial: CarImageResponse[] }) {
  const [images, setImages] = useState(initial);
  const [picked, setPicked] = useState<Checked<Picked>[]>([]);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function pick(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = await Promise.all(
      Array.from(list).map(async (file) => ({
        name: file.name,
        size: file.size,
        head: new Uint8Array(await file.slice(0, 12).arrayBuffer()),
        file,
      })),
    );
    const result = checkImages(images.length, files);
    setPicked(result.items);
    setLimitError(result.limitError);
    setMessage(null);
  }

  const valid = picked.filter((p) => !p.error).map((p) => p.file.file);
  const canUpload = valid.length > 0 && !limitError;

  function upload() {
    if (!canUpload) return;
    startTransition(async () => {
      try {
        const updated = await clientApi.images.upload(carId, valid);
        setImages(updated);
        setPicked([]);
        if (input.current) input.current.value = "";
        setMessage({ tone: "ok", text: `${valid.length} görsel yüklendi.` });
      } catch (error) {
        setMessage({ tone: "err", text: errorMessage(error, "images") });
      }
    });
  }

  function makeCover(imageId: string) {
    startTransition(async () => {
      try {
        setImages(await clientApi.images.makeCover(carId, imageId));
        setMessage({ tone: "ok", text: "Kapak görseli değişti. Listelerde görünmesi bir dakika kadar sürebilir." });
      } catch (error) {
        setMessage({ tone: "err", text: errorMessage(error, "images") });
      }
    });
  }

  function remove(imageId: string) {
    startTransition(async () => {
      try {
        await clientApi.images.remove(carId, imageId);
        setImages((list) => list.filter((i) => i.id !== imageId).map((img, i) => ({ ...img, cover: i === 0 })));
        setConfirmId(null);
        setMessage({ tone: "ok", text: "Görsel silindi." });
      } catch (error) {
        setMessage({ tone: "err", text: errorMessage(error, "images") });
      }
    });
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    void pick(event.dataTransfer.files);
  }

  const room = MAX_IMAGES_PER_CAR - images.length;

  return (
    <div className="space-y-5" aria-busy={pending}>
      {message ? <Notice tone={message.tone} title={message.text} /> : null}

      {images.length === 0 ? (
        <p className="border border-dashed border-rule px-4 py-6 text-sm text-muted">
          Bu aracın görseli yok. Sitede yer tutucu çizim gösteriliyor.
        </p>
      ) : (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {images.map((image, i) => (
            <li key={image.id} className={`border ${image.cover ? "border-navy" : "border-rule"}`}>
              <div className="relative">
                <CarImage src={toBrowserPath(image.url)} alt={`Görsel ${i + 1}`} className="aspect-[4/3] w-full" />
                {image.cover ? (
                  <span className="figures absolute top-0 left-0 bg-navy px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-widest text-white">KAPAK</span>
                ) : null}
              </div>
              <div className="figures flex justify-between px-2 pt-1.5 text-[0.6875rem] text-muted">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  {TYPE_LABEL[image.contentType] ?? image.contentType} · {formatBytes(image.sizeBytes)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2">
                {confirmId === image.id ? (
                  <>
                    <button type="button" className={buttonClass("danger", "sm")} disabled={pending} onClick={() => remove(image.id)}>
                      Evet, sil
                    </button>
                    <button type="button" className={buttonClass("quiet", "sm")} onClick={() => setConfirmId(null)}>
                      Vazgeç
                    </button>
                  </>
                ) : (
                  <>
                    {!image.cover ? (
                      <button type="button" className={buttonClass("outline", "sm")} disabled={pending} onClick={() => makeCover(image.id)}>
                        Kapak yap
                      </button>
                    ) : null}
                    <button type="button" className={buttonClass("danger", "sm")} disabled={pending} onClick={() => setConfirmId(image.id)}>
                      Sil<span className="sr-only"> görsel {i + 1}</span>
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div>
        <label
          htmlFor="gorsel-sec"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`block cursor-pointer border-2 border-dashed px-4 py-6 text-center text-sm ${
            dragging ? "border-navy bg-info-bg" : "border-rule-strong hover:bg-card"
          } ${room <= 0 ? "pointer-events-none opacity-60" : ""}`}
        >
          <span className="font-semibold text-navy">Dosya seç</span> ya da buraya sürükle
          <span className="figures mt-1 block text-xs text-muted">
            JPEG · PNG · WEBP · DOSYA BAŞINA EN FAZLA 5 MB · {room > 0 ? `${room} YER KALDI` : "SINIR DOLU (10/10)"}
          </span>
        </label>
        <input
          ref={input}
          id="gorsel-sec"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={room <= 0}
          onChange={(e) => void pick(e.target.files)}
        />
      </div>

      {picked.length > 0 ? (
        <div className="space-y-3">
          <ul className="border-t border-navy text-sm">
            {picked.map(({ file, error }, index) => (
              <li key={`${index}-${file.name}`} className="flex items-baseline gap-3 border-b border-rule py-1.5">
                <span className={`min-w-0 flex-1 truncate ${error ? "text-muted line-through" : "text-ink"}`}>{file.name}</span>
                <span className="figures text-xs text-muted">{formatBytes(file.size)}</span>
                <span className={`text-xs font-semibold ${error ? "text-err" : "text-ok"}`}>{error ?? "Hazır"}</span>
              </li>
            ))}
          </ul>
          {limitError ? <Notice tone="err" title={limitError} /> : null}
          <div className="flex gap-3">
            <button type="button" className={buttonClass("primary")} onClick={upload} disabled={!canUpload || pending}>
              {pending ? "Yükleniyor…" : `${valid.length} görseli yükle`}
            </button>
            <button
              type="button"
              className={buttonClass("outline")}
              onClick={() => {
                setPicked([]);
                setLimitError(null);
                if (input.current) input.current.value = "";
              }}
              disabled={pending}
            >
              Seçimi temizle
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
