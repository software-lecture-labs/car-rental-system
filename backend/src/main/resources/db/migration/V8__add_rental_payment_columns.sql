ALTER TABLE rental_transactions
    ADD COLUMN deposit_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN refunded_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN picked_up_at    TIMESTAMP;

UPDATE rental_transactions SET deposit_amount = total_amount;

UPDATE rental_transactions rt
SET picked_up_at = rt.rental_start
FROM cars c
WHERE c.id = rt.car_id
  AND (rt.status = 'COMPLETED' OR (rt.status = 'PENDING' AND c.status = 'RENTED'));

ALTER TABLE rental_transactions
    ADD CONSTRAINT ck_rental_deposit  CHECK (deposit_amount >= 0 AND deposit_amount <= total_amount),
    ADD CONSTRAINT ck_rental_refunded CHECK (refunded_amount >= 0 AND refunded_amount <= total_amount);
