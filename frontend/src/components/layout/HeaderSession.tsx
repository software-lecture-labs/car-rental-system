import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { buttonClass } from "@/components/ui/button";
import { LogoutButton } from "./LogoutButton";

/** Üst çubuktaki oturum alanı. Cookie okuduğu için root layout'ta <Suspense> içinde durur. */
export async function HeaderSession() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <>
        <Link href="/giris" className={buttonClass("quiet", "sm")}>
          Giriş yap
        </Link>
        <Link href="/kayit" className={buttonClass("outline", "sm")}>
          Kayıt ol
        </Link>
      </>
    );
  }

  const isAdmin = user.role === "ADMIN";
  return (
    <>
      <span className="hidden text-right leading-tight sm:block">
        <span className="doc-label block">{isAdmin ? "Yönetici" : "Müşteri"}</span>
        <span className="text-sm font-semibold text-navy">
          {user.firstName} {user.lastName}
        </span>
      </span>
      <Link href={isAdmin ? "/admin" : "/hesabim"} className={buttonClass("primary", "sm")}>
        {isAdmin ? "Yönetim" : "Hesabım"}
      </Link>
      <LogoutButton />
    </>
  );
}

export function HeaderSessionFallback() {
  return <span aria-hidden className="block h-8 w-40" />;
}
