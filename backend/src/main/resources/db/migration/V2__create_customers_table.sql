-- Müşteriye özel alanlar. users ile 1-1 ilişki:
-- user_id hem PK hem users.id'ye FK (JPA'da Customer extends User, JOINED inheritance).
CREATE TABLE customers (
    user_id       UUID           PRIMARY KEY,
    license_year  INT            NOT NULL,
    balance       NUMERIC(12,2)  NOT NULL DEFAULT 0,
    CONSTRAINT fk_customers_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT ck_customers_license_year CHECK (license_year >= 1950),
    CONSTRAINT ck_customers_balance      CHECK (balance >= 0)
);
