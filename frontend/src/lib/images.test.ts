import { describe, expect, it } from "vitest";
import { checkImages, detectImageType } from "./images";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const WEBP = new TextEncoder().encode("RIFF\0\0\0\0WEBP");
const GIF = new TextEncoder().encode("GIF89a\0\0\0\0\0\0");

describe("detectImageType", () => {
  it("türü dosyanın ilk byte'larından belirler", () => {
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(PNG)).toBe("image/png");
    expect(detectImageType(WEBP)).toBe("image/webp");
    expect(detectImageType(GIF)).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});

describe("checkImages", () => {
  const file = (name: string, size: number, head = JPEG) => ({ name, size, head });

  it("boyut ve tür hatalarını dosya bazında işaretler", () => {
    const { items, limitError } = checkImages(0, [file("a.jpg", 1000), file("b.jpg", 5 * 1024 * 1024 + 1), file("c.gif", 10, GIF), file("d.png", 0, PNG)]);
    expect(items.map((i) => i.error === null)).toEqual([true, false, false, false]);
    expect(limitError).toBeNull();
  });

  it("tam 5 MB'a izin verir", () => {
    expect(checkImages(0, [file("a.jpg", 5 * 1024 * 1024)]).items[0].error).toBeNull();
  });

  it("araç başına 10 görsel sınırını yüklemeden önce denetler", () => {
    expect(checkImages(8, [file("a", 1), file("b", 1)]).limitError).toBeNull();
    expect(checkImages(8, [file("a", 1), file("b", 1), file("c", 1)]).limitError).toContain("en fazla 2");
    expect(checkImages(10, [file("a", 1)]).limitError).toContain("zaten 10");
    // geçersiz dosyalar sınırı doldurmaz
    expect(checkImages(9, [file("a", 1), file("b", 1, GIF)]).limitError).toBeNull();
  });
});
