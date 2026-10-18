-- Aynı araç için tarih aralığı çakışan iki aktif kiralama olamaz.
-- Uygulamada kontrol etsek bile aynı anda gelen iki istek ikisini birden kaydedebilir;
-- bu kısıt son savunma hattıdır (ihlal edilirse SQLSTATE 23P01 döner).
-- '[)' : bitiş anı hariç -> biri 10:00'da bitip diğeri 10:00'da başlayabilir.
-- Sadece PENDING ve COMPLETED dikkate alınır; iptal / geri alınanlar aracı bloklamaz.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE rental_transactions
    ADD CONSTRAINT ex_rental_no_overlap
    EXCLUDE USING gist (
        car_id WITH =,
        tsrange(rental_start, rental_end, '[)') WITH &&
    )
    WHERE (status IN ('PENDING', 'COMPLETED'));
