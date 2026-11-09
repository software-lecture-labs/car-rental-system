ALTER TABLE rental_transactions
    ADD COLUMN cancellation_reason VARCHAR(30),
    ADD COLUMN replaces_rental_id  UUID;

ALTER TABLE rental_transactions
    ADD CONSTRAINT ck_rental_cancellation_reason CHECK (cancellation_reason IN
        ('CUSTOMER_REQUEST', 'NO_SHOW', 'BREAKDOWN', 'COMPANY_DECISION', 'CUSTOMER_VIOLATION')),
    ADD CONSTRAINT fk_rental_replaces
        FOREIGN KEY (replaces_rental_id) REFERENCES rental_transactions (id) ON DELETE RESTRICT,
    ADD CONSTRAINT ux_rental_replaces UNIQUE (replaces_rental_id);
