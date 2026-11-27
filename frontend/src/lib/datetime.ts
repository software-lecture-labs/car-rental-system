/**
 * Backend tarihleri saat dilimi bilgisi olmayan LocalDateTime ("2026-11-20T10:00:00").
 * Bunları Europe/Istanbul yerel saati olarak ele alıyoruz: JS Date'e çevirip tarayıcının saat dilimine
 * kaydırmıyoruz, gönderirken de "Z" eklemiyor ve UTC'ye çevirmiyoruz. Bütün hesaplar takvim alanları üzerinden.
 */

export type LocalDateTime = string;

export interface DateTimeParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export const TIME_ZONE = "Europe/Istanbul";

const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;

export function parseLocalDateTime(value: string): DateTimeParts | null {
  const m = LOCAL_PATTERN.exec(value.trim());
  if (!m) return null;
  const parts = {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: Number(m[4]),
    minute: Number(m[5]),
    second: m[6] ? Number(m[6]) : 0,
  };
  // 2026-02-30 gibi takvimde olmayan günleri reddet
  const check = fromEpoch(toEpoch(parts));
  if (check.year !== parts.year || check.month !== parts.month || check.day !== parts.day) return null;
  if (parts.hour > 23 || parts.minute > 59 || parts.second > 59) return null;
  return parts;
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/** Backend'e gönderilecek biçim: saniyeli, saat dilimsiz. */
export function toLocalDateTime(p: DateTimeParts): LocalDateTime {
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

/** <input type="date"> değeri */
export function toDateInput(p: DateTimeParts): string {
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`;
}

/** <input type="time"> değeri */
export function toTimeInput(p: DateTimeParts): string {
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "2026-11-20" + "10:30" -> "2026-11-20T10:30:00"; geçersizse null */
export function combineDateTime(date: string, time: string): LocalDateTime | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const parsed = parseLocalDateTime(`${date}T${time}:00`);
  return parsed ? toLocalDateTime(parsed) : null;
}

// Takvim alanlarını saat dilimsiz bir sayıya çeviriyoruz (UTC kullanmamızın tek sebebi yaz saati kaymasının olmaması).
function toEpoch(p: DateTimeParts): number {
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

function fromEpoch(ms: number): DateTimeParts {
  const d = new Date(ms);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

export function addDays(p: DateTimeParts, days: number): DateTimeParts {
  return fromEpoch(toEpoch(p) + days * 86_400_000);
}

export function addHours(p: DateTimeParts, hours: number): DateTimeParts {
  return fromEpoch(toEpoch(p) + hours * 3_600_000);
}

/** a < b ise negatif, eşitse 0, a > b ise pozitif */
export function compareParts(a: DateTimeParts, b: DateTimeParts): number {
  return toEpoch(a) - toEpoch(b);
}

export function hoursBetween(from: DateTimeParts, to: DateTimeParts): number {
  return (toEpoch(to) - toEpoch(from)) / 3_600_000;
}

/** Şu an İstanbul'da saat kaç? Tarayıcının saat dilimi ne olursa olsun aynı sonucu verir. */
export function istanbulNow(now: Date = new Date()): DateTimeParts {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(fmt.formatToParts(now).find((x) => x.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** Arama formunun varsayılanı: yarın 10:00 (İstanbul) */
export function defaultPickup(now: Date = new Date()): DateTimeParts {
  const tomorrow = addDays(istanbulNow(now), 1);
  return { ...tomorrow, hour: 10, minute: 0, second: 0 };
}

/**
 * Backend'deki RentalTransaction.getRentalDays ile aynı: saat farkını yukarı yuvarlayıp güne çevirir, en az 1.
 */
export function rentalDaysBetween(start: LocalDateTime, end: LocalDateTime): number {
  const s = parseLocalDateTime(start);
  const e = parseLocalDateTime(end);
  if (!s || !e) return 1;
  const hours = Math.floor(hoursBetween(s, e));
  return Math.max(1, Math.floor((hours + 23) / 24));
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const WEEKDAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function partsOf(value: LocalDateTime | DateTimeParts): DateTimeParts | null {
  return typeof value === "string" ? parseLocalDateTime(value) : value;
}

/** "20.11.2026 10:00" — tablolar ve fişler için, eş aralıklı fontla */
export function formatDateTimeNumeric(value: LocalDateTime | DateTimeParts): string {
  const p = partsOf(value);
  if (!p) return "—";
  return `${pad(p.day)}.${pad(p.month)}.${p.year} ${pad(p.hour)}:${pad(p.minute)}`;
}

/** "20.11.2026" */
export function formatDateNumeric(value: LocalDateTime | DateTimeParts): string {
  const p = partsOf(value);
  if (!p) return "—";
  return `${pad(p.day)}.${pad(p.month)}.${p.year}`;
}

/** "20 Kasım 2026, Cuma 10:00" */
export function formatDateTimeLong(value: LocalDateTime | DateTimeParts): string {
  const p = partsOf(value);
  if (!p) return "—";
  const weekday = WEEKDAYS[new Date(toEpoch(p)).getUTCDay()];
  return `${p.day} ${MONTHS[p.month - 1]} ${p.year}, ${weekday} ${pad(p.hour)}:${pad(p.minute)}`;
}

/** "20 Kas" */
export function formatDayShort(value: LocalDateTime | DateTimeParts): string {
  const p = partsOf(value);
  if (!p) return "—";
  return `${p.day} ${MONTHS_SHORT[p.month - 1]}`;
}
