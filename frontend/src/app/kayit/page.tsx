import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Container, PageHead } from "@/components/layout/Shell";
import { RentalTerms } from "@/components/rental/RentalTerms";
import { safeNextPath } from "@/lib/session";

export const metadata: Metadata = { title: "Kayıt ol" };

export default function RegisterPage({ searchParams }: PageProps<"/kayit">) {
  return (
    <Container>
      <PageHead
        form="FORM RC-11 · MÜŞTERİ KAYDI"
        title="Kayıt ol"
        lead="Kayıttan sonra bakiyeni yükleyip rezervasyon yapabilirsin. Ehliyet yılın kiralama kaydında kullanılır."
      />
      <div className="grid gap-12 pt-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Suspense fallback={<div className="h-96" />}>
            <RegisterSection searchParams={searchParams} />
          </Suspense>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9" aria-labelledby="kosullar">
          <h2 id="kosullar" className="doc-label text-navy!">
            Kiralama koşulları
          </h2>
          <div className="mt-3">
            <RentalTerms compact />
          </div>
        </aside>
      </div>
    </Container>
  );
}

async function RegisterSection({ searchParams }: { searchParams: PageProps<"/kayit">["searchParams"] }) {
  const params = await searchParams;
  return <RegisterForm next={safeNextPath(params.next, "")} />;
}
