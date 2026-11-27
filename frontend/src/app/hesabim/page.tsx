import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileForm } from "@/components/account/ProfileForm";
import { SectionHead } from "@/components/layout/SectionHead";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { serverApi } from "@/lib/api/server";
import { attempt } from "@/lib/attempt";
import { errorMessage } from "@/lib/messages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilePage() {
  return (
    <>
      <SectionHead code="BÖLÜM 01" title="Profil" lead="Adını, soyadını ve ehliyet yılını güncelleyebilirsin." />
      <div className="pt-6">
        <Suspense fallback={<BlockSkeleton className="h-72 max-w-2xl" />}>
          <Profile />
        </Suspense>
      </div>
    </>
  );
}

async function Profile() {
  const user = await requireRole("CUSTOMER");
  const customer = await attempt(serverApi.customers.get(user.id));
  if (!customer.ok) return <Notice tone="err" title="Profil yüklenemedi.">{errorMessage(customer.error, "load")}</Notice>;
  return <ProfileForm customer={customer.data} />;
}
