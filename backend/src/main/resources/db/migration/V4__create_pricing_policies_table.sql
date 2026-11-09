-- Kiralama süresine göre iskonto kademeleri.
-- Kural: gün sayısı >= min_days olan EN YÜKSEK kademe uygulanır.
-- discount_rate oran olarak tutulur: 0.1000 = %10
CREATE TABLE pricing_policies (
    id             UUID          PRIMARY KEY DEFAULT uuidv7(),
    policy_name    VARCHAR(100)  NOT NULL,
    min_days       INT           NOT NULL,
    discount_rate  NUMERIC(5,4)  NOT NULL,
    CONSTRAINT ux_pricing_policies_name     UNIQUE (policy_name),
    CONSTRAINT ux_pricing_policies_min_days UNIQUE (min_days),
    CONSTRAINT ck_pricing_policies_min_days CHECK (min_days >= 1),
    CONSTRAINT ck_pricing_policies_discount CHECK (discount_rate >= 0 AND discount_rate < 1)
);
