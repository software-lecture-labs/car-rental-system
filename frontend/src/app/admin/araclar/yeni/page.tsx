import type { Metadata } from "next";
import Link from "next/link";
import { CarForm } from "@/components/admin/CarForm";
import { SectionHead } from "@/components/layout/SectionHead";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Yeni araç" };

export default function NewCarPage() {
  return (
    <>
      <SectionHead
        code="DEFTER 01 · YENİ KAYIT"
        title="Yeni araç"
        lead="Araç müsait durumda eklenir. Görselleri kaydettikten sonra açılan sayfadan yükleyebilirsin."
        aside={
          <Link href="/admin" className={buttonClass("quiet", "sm")}>
            ← Araçlar
          </Link>
        }
      />
      <div className="pt-6">
        <CarForm />
      </div>
    </>
  );
}
