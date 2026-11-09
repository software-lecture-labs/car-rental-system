-- Kiralama işlemleri.
-- daily_price ve discount_rate işlem anındaki değerlerin KOPYASIDIR (snapshot):
-- admin tarifeyi sonradan değiştirse de geçmiş işlemlerin tutarı değişmez.
CREATE TABLE rental_transactions (
    id                UUID           PRIMARY KEY DEFAULT uuidv7(),
    car_id            UUID           NOT NULL,
    customer_id       UUID           NOT NULL,
    rental_start      TIMESTAMP      NOT NULL,
    rental_end        TIMESTAMP      NOT NULL,
    transaction_date  TIMESTAMP      NOT NULL DEFAULT LOCALTIMESTAMP,
    daily_price       NUMERIC(10,2)  NOT NULL,
    discount_rate     NUMERIC(5,4)   NOT NULL DEFAULT 0,
    total_amount      NUMERIC(12,2)  NOT NULL,
    status            VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    -- RESTRICT: geçmişi olan araç/müşteri silinemez (finansal kayıt kaybolmasın)
    CONSTRAINT fk_rental_car
        FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rental_customer
        FOREIGN KEY (customer_id) REFERENCES customers (user_id) ON DELETE RESTRICT,
    CONSTRAINT ck_rental_dates       CHECK (rental_end > rental_start),
    CONSTRAINT ck_rental_daily_price CHECK (daily_price > 0),
    CONSTRAINT ck_rental_discount    CHECK (discount_rate >= 0 AND discount_rate < 1),
    CONSTRAINT ck_rental_total       CHECK (total_amount >= 0),
    CONSTRAINT ck_rental_status      CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'ROLLED_BACK'))
);

-- "Müşterinin kiralamaları" ve "aracın geçmişi" sorguları için
CREATE INDEX ix_rental_customer ON rental_transactions (customer_id);
CREATE INDEX ix_rental_car      ON rental_transactions (car_id);
