import { DEPOSIT_RATE_PERCENT } from "@/lib/pricing";

/**
 * Kiralama koşulları. Hepsi backend'deki RentalTransactionService kurallarından:
 * ön ödeme %20, ücretsiz iptal için 24 saat, teslim alma için 4 saat.
 */
export function RentalTerms({ compact = false }: { compact?: boolean }) {
  const items = [
    ["Ön ödeme", `Rezervasyonda toplamın %${DEPOSIT_RATE_PERCENT}'si bakiyeden düşülür; kalan tutar araç teslim edilirken alınır.`],
    ["İptal", "Başlangıçtan 24 saat öncesine kadar iptal edersen ön ödeme bakiyene iade edilir; daha geç iptalde iade edilmez."],
    ["Teslim", "Aracı başlangıç gününde teslim alırsın. Başlangıç saatinden sonra 4 saat içinde alınmayan rezervasyon iptal olur."],
    ["İndirim", "İndirim kademesi gün sayısına göre otomatik uygulanır; paket seçmen gerekmez."],
  ] as const;

  return (
    <ol className={`border-t border-rule ${compact ? "text-[0.8125rem]" : "text-sm"}`}>
      {items.map(([title, text], index) => (
        <li key={title} className="grid grid-cols-[2.25rem_1fr] gap-x-2 border-b border-rule py-2.5">
          <span className="figures text-xs text-muted">{String(index + 1).padStart(2, "0")}</span>
          <span>
            <span className="font-semibold text-navy">{title}. </span>
            <span className="text-ink">{text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
