import type { Metadata, Viewport } from "next";
// Fontlar npm paketinden: build sırasında dışarıdan font indirilmez. Üçü de latin-ext alt kümesiyle
// İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü ve ₺ karakterlerini içerir.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/ibm-plex-sans/wght.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/layout/Shell";

export const metadata: Metadata = {
  title: { default: "RentACar · Araç kiralama", template: "%s · RentACar" },
  description: "Tarihe göre müsait aracı bul, fiyatı gün gün gör, rezervasyonunu yap.",
};

export const viewport: Viewport = {
  themeColor: "#0A2540",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#icerik"
          className="sr-only z-50 bg-navy px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          İçeriğe geç
        </a>
        <SiteHeader session={null} />
        <main id="icerik" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
