-- Araç görselleri. Görseller dosya olarak değil, doğrudan veritabanında (BYTEA) saklanır.
-- Bir aracın 0..10 görseli olabilir; sort_order değeri en küçük olan görsel kapak görselidir.
-- Araç silinince görselleri de silinir (ON DELETE CASCADE).
CREATE TABLE car_images (
    id            UUID         PRIMARY KEY DEFAULT uuidv7(),
    car_id        UUID         NOT NULL,
    content_type  VARCHAR(50)  NOT NULL,
    data          BYTEA        NOT NULL,
    size_bytes    INT          NOT NULL,
    sort_order    INT          NOT NULL DEFAULT 0,
    uploaded_at   TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT fk_car_images_car          FOREIGN KEY (car_id) REFERENCES cars (id) ON DELETE CASCADE,
    CONSTRAINT ck_car_images_content_type CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
    CONSTRAINT ck_car_images_size         CHECK (size_bytes > 0 AND size_bytes <= 5242880)
);

-- Bir aracın görsellerini kapak sırasıyla getirmek için
CREATE INDEX ix_car_images_car_order ON car_images (car_id, sort_order);
