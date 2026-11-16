import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentACar",
  description: "Araç kiralama",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
