import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGES_PER_CAR } from "@/lib/api/types";
import { formatBytes } from "@/lib/format";

/**
 * Görsel yüklemeden ÖNCE yapılan kontroller (backend CarImageService ile aynı kurallar):
 * araç başına en fazla 10 görsel, dosya başına en fazla 5 MB, sadece JPEG / PNG / WebP.
 * Backend türü dosyanın ilk byte'larından belirliyor; biz de uzantıya/MIME'ye değil byte'lara bakıyoruz.
 */

export type ImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export function detectImageType(head: Uint8Array): ImageType | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (head.length >= 8 && png.every((b, i) => head[i] === b)) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
  if (head.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export interface CandidateFile {
  name: string;
  size: number;
  head: Uint8Array;
}

export interface Checked<T extends CandidateFile> {
  file: T;
  error: string | null;
}

export function checkImages<T extends CandidateFile>(existingCount: number, files: readonly T[]): {
  items: Checked<T>[];
  limitError: string | null;
} {
  const items = files.map((file) => {
    let error: string | null = null;
    if (file.size === 0) error = "Dosya boş.";
    else if (file.size > MAX_IMAGE_BYTES) error = `${formatBytes(file.size)}; en fazla 5 MB olabilir.`;
    else if (!detectImageType(file.head)) error = "JPEG, PNG ya da WebP değil.";
    return { file, error };
  });
  const valid = items.filter((i) => !i.error).length;
  const room = Math.max(0, MAX_IMAGES_PER_CAR - existingCount);
  const limitError =
    valid > room
      ? room === 0
        ? `Bu araçta zaten ${MAX_IMAGES_PER_CAR} görsel var. Yenisini eklemek için önce birini sil.`
        : `Bu araca en fazla ${room} görsel daha eklenebilir; ${valid} geçerli dosya seçtin.`
      : null;
  return { items, limitError };
}
