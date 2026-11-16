"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logout } from "@/lib/api/client";
import { buttonClass } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={buttonClass("outline", "sm")}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logout();
          router.push("/");
          router.refresh();
        })
      }
    >
      {pending ? "Çıkılıyor…" : "Çıkış"}
    </button>
  );
}
