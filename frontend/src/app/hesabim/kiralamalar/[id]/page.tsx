import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CancelRental } from "@/components/account/CancelRental";
import { SectionHead } from "@/components/layout/SectionHead";
import { RentalReceipt } from "@/components/rental/RentalReceipt";
import { BlockSkeleton } from "@/components/ui/Skeleton";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/button";
import { serverApi } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import { attempt } from "@/lib/attempt";
import { addHours, formatDateTimeNumeric, parseLocalDateTime } from "@/lib/datetime";
import { errorMessage } from "@/lib/messages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Kiralama" };

export default function RentalDetailPage({ params }: PageProps<"/hesabim/kiralamalar/[id]">) {
  return (
    <>
      <SectionHead
        code="BÖLÜM 03 · SÖZLEŞME"
        title="Kiralama"
        aside={
          <Link href="/hesabim/kiralamalar" className={buttonClass("quiet", "sm")}>
            ← Bütün kiralamalar
          </Link>
        }
      />
      <Suspense fallback={<BlockSkeleton className="mt-6 h-96 max-w-xl" />}>
        <RentalDetail params={params} />
      </Suspense>
    </>
  );
}

async function RentalDetail({ params }: { params: PageProps<"/hesabim/kiralamalar/[id]">["params"] }) {
  const { id } = await params;
  await requireRole("CUSTOMER");
  const result = await attempt(serverApi.rentals.get(id));
  if (!result.ok) {
    // 403: başkasının kaydı; varlığını da belli etmiyoruz
    if (isApiError(result.error) && [400, 403, 404].includes(result.error.status)) notFound();
    return <Notice tone="err" title="Kiralama yüklenemedi." className="mt-6">{errorMessage(result.error, "load")}</Notice>;
  }
  const rental = result.data;
  const canCancel = rental.status === "PENDING" && !rental.pickedUpAt;
  const start = parseLocalDateTime(rental.rentalStart);

  return (
    <div className="grid gap-10 pt-6 xl:grid-cols-12">
      <div className="xl:col-span-7">
        <RentalReceipt rental={rental} />
      </div>
      <div className="space-y-6 xl:col-span-5">
        {canCancel ? (
          <>
            <div>
              <h2 className="doc-label mb-2 text-navy!">Teslim</h2>
              <p className="text-sm text-ink">
                Aracı <span className="figures font-semibold">{formatDateTimeNumeric(rental.rentalStart)}</span> itibarıyla teslim alabilirsin.
                {start ? (
                  <>
                    {" "}
                    <span className="figures">{formatDateTimeNumeric(addHours(start, 4))}</span> saatine kadar alınmazsa rezervasyon iptal olur.
                  </>
                ) : null}
              </p>
            </div>
            <CancelRental rentalId={rental.id} rentalStart={rental.rentalStart} deposit={rental.depositAmount} />
          </>
        ) : rental.status === "PENDING" ? (
          <Notice tone="info" title="Araç sende.">
            İade <span className="figures">{formatDateTimeNumeric(rental.rentalEnd)}</span> tarihinde. Teslim alınmış kiralama iptal edilemez.
          </Notice>
        ) : null}
        <Link href={`/araclar/${rental.carId}`} className={buttonClass("outline")}>
          Aracın sayfası
        </Link>
      </div>
    </div>
  );
}
