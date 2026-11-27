import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Container, PageHead } from "@/components/layout/Shell";
import { RentalTerms } from "@/components/rental/RentalTerms";
import { safeNextPath } from "@/lib/session";

export const metadata: Metadata = { title: "Giriş" };

export default function LoginPage({ searchParams }: PageProps<"/giris">) {
  return (
    <Container>
      <PageHead form="FORM RC-10 · OTURUM AÇMA" title="Giriş yap" />
      <div className="grid gap-12 pt-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Suspense fallback={<div className="h-64" />}>
            <LoginSection searchParams={searchParams} />
          </Suspense>
        </div>
        <aside className="lg:col-span-5 lg:col-start-8" aria-labelledby="kosullar">
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

async function LoginSection({ searchParams }: { searchParams: PageProps<"/giris">["searchParams"] }) {
  const params = await searchParams;
  return <LoginForm next={safeNextPath(params.next, "")} expired={params.sure === "doldu"} />;
}
