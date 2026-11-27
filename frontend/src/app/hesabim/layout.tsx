import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Container } from "@/components/layout/Shell";
import { SectionNav } from "@/components/layout/SectionNav";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: { default: "Hesabım", template: "%s · Hesabım · RentACar" } };

const NAV = [
  { href: "/hesabim", label: "Profil", exact: true },
  { href: "/hesabim/bakiye", label: "Bakiye" },
  { href: "/hesabim/kiralamalar", label: "Kiralamalarım" },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <Container>
      <Suspense fallback={<GateSkeleton />}>
        <AccountGate>{children}</AccountGate>
      </Suspense>
    </Container>
  );
}

/** Rol kontrolü GET /api/auth/me ile; müşteri değilse yönlendirir. */
async function AccountGate({ children }: { children: ReactNode }) {
  const user = await requireRole("CUSTOMER");
  return (
    <>
      <div className="border-b border-rule pt-8 pb-5">
        <p className="doc-label figures">FORM RC-20 · MÜŞTERİ DOSYASI</p>
        <p className="mt-2 font-display text-[1.75rem] leading-tight font-bold text-navy" style={{ fontStretch: "118%" }}>
          {user.firstName} {user.lastName}
        </p>
        <p className="figures mt-1 text-xs text-muted">{user.email}</p>
      </div>
      <div className="grid gap-x-10 gap-y-6 pt-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <SectionNav items={NAV} label="Hesap bölümleri" />
        </div>
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </>
  );
}

function GateSkeleton() {
  return (
    <div className="pt-8" role="status">
      <span className="sr-only">Hesap yükleniyor…</span>
      <BlockSkeleton className="h-20 w-80" />
      <BlockSkeleton className="mt-6 h-64" />
    </div>
  );
}
