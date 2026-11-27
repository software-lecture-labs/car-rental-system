import Link from "next/link";
import { Stamp } from "@/components/doc/Stamp";
import { Container } from "@/components/layout/Shell";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="py-16">
      <div className="max-w-xl border-l-4 border-navy pl-6">
        <p className="doc-label figures">KAYIT BULUNAMADI · 404</p>
        <h1 className="mt-2 text-3xl">Aradığın sayfa ya da kayıt yok.</h1>
        <p className="mt-3 text-muted">Bağlantı eski olabilir ya da araç sistemden kaldırılmış olabilir.</p>
        <div className="mt-6 flex items-center gap-6">
          <Link href="/araclar" className={buttonClass("primary")}>
            Araçlara dön
          </Link>
          <Stamp label="Geçersiz" tone="muted" size="sm" />
        </div>
      </div>
    </Container>
  );
}
