-- Kiralanabilir araçlar.
-- Enum'lar VARCHAR + CHECK olarak tutulur (JPA'da @Enumerated(EnumType.STRING)).
CREATE TABLE cars (
    id                UUID           PRIMARY KEY DEFAULT uuidv7(),
    brand             VARCHAR(50)    NOT NULL,
    model             VARCHAR(50)    NOT NULL,
    production_year   INT            NOT NULL,
    fuel_type         VARCHAR(20)    NOT NULL,
    transmission      VARCHAR(20)    NOT NULL,
    color             VARCHAR(30)    NOT NULL,
    plate             VARCHAR(10)    NOT NULL,  -- normalize: büyük harf, boşluksuz -> 34ABC123
    seat_count        INT            NOT NULL,
    daily_base_price  NUMERIC(10,2)  NOT NULL,
    status            VARCHAR(20)    NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT ux_cars_plate           UNIQUE (plate),
    CONSTRAINT ck_cars_plate_format    CHECK (plate ~ '^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$'),
    CONSTRAINT ck_cars_production_year CHECK (production_year BETWEEN 1950 AND 2100),
    CONSTRAINT ck_cars_fuel_type       CHECK (fuel_type IN ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID')),
    CONSTRAINT ck_cars_transmission    CHECK (transmission IN ('MANUAL', 'AUTOMATIC')),
    CONSTRAINT ck_cars_seat_count      CHECK (seat_count BETWEEN 1 AND 20),
    CONSTRAINT ck_cars_daily_price     CHECK (daily_base_price > 0),
    CONSTRAINT ck_cars_status          CHECK (status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE'))
);

-- Ana sayfadaki "müsait araçlar" listesi için
CREATE INDEX ix_cars_status ON cars (status);
