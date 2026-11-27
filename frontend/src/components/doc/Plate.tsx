import { formatPlate } from "@/lib/format";

type PlateSize = "sm" | "md" | "lg";

const sizes: Record<PlateSize, { box: string; strip: string; tr: string; text: string }> = {
  sm: { box: "h-7", strip: "w-[0.9rem] pb-[2px]", tr: "text-[0.45rem]", text: "px-2 text-[0.9rem]" },
  md: { box: "h-9", strip: "w-[1.15rem] pb-[3px]", tr: "text-[0.55rem]", text: "px-2.5 text-[1.15rem]" },
  lg: { box: "h-14", strip: "w-[1.7rem] pb-1", tr: "text-[0.8rem]", text: "px-4 text-[1.85rem]" },
};

/**
 * Türkiye plakası: beyaz zemin, ince koyu çerçeve, solda mavi şerit ve "TR".
 * Kartta, detayda, kiralama kayıtlarında ve admin tablolarında aynı bileşen kullanılır.
 */
export function Plate({ plate, size = "md", className = "" }: { plate: string; size?: PlateSize; className?: string }) {
  const text = formatPlate(plate);
  const s = sizes[size];
  return (
    <span
      role="img"
      aria-label={`Plaka ${text}`}
      className={`inline-flex shrink-0 items-stretch overflow-hidden rounded-sm border-[1.5px] border-plate-ink bg-white align-middle ${s.box} ${className}`}
    >
      <span aria-hidden className={`flex flex-col items-center justify-end bg-plate-blue ${s.strip}`}>
        <span className={`font-sans font-bold leading-none tracking-wide text-white ${s.tr}`}>TR</span>
      </span>
      <span
        aria-hidden
        className={`figures flex items-center whitespace-nowrap font-semibold leading-none text-plate-ink ${s.text}`}
        style={{ letterSpacing: "0.04em" }}
      >
        {text}
      </span>
    </span>
  );
}
