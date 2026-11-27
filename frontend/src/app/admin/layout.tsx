import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Container } from "@/components/layout/Shell";
import { SectionNav } from "@/components/layout/SectionNav";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: { default: "Yönetim", template: "%s · Yönetim · RentACar" } };

const NAV = [
  { href: "/admin", label: "Araçlar", exact: true },
  { href: "/admin/kiralamalar", label: "Kiralamalar" },
  { href: "/admin/musteriler", label: "Müşteriler" },
  { href: "/admin/fiyatlar", label: "Fiyat kademeleri" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Container>
      <Suspense fallback={<BlockSkeleton className="mt-8 h-96" />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </Container>
  );
}

/** Rol kontrolü GET /api/auth/me ile; yönetici değilse yönlendirir. */
async function AdminGate({ children }: { children: ReactNode }) {
  const user = await requireRole("ADMIN");
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pt-6 pb-3">
        <p className="doc-label figures">FORM RC-90 · YÖNETİM DEFTERİ</p>
        <p className="figures text-xs text-muted">
          {user.firstName} {user.lastName} · {user.email}
        </p>
      </div>
      <div className="pt-4">
        <SectionNav items={NAV} label="Yönetim bölümleri" orientation="horizontal" />
      </div>
      <div className="min-w-0 pt-6">{children}</div>
    </>
  );
}
