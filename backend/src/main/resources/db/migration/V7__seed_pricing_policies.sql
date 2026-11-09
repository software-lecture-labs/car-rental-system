-- Başlangıç iskonto kademeleri (referans veri: her ortamda olmalı).
-- Sonradan değişiklik bu dosyadan DEĞİL, admin panelinden (updateTariff) ya da yeni migration ile yapılır.
INSERT INTO pricing_policies (policy_name, min_days, discount_rate) VALUES
    ('Standart',  1, 0.0000),
    ('Haftalık',  7, 0.1000),
    ('Aylık',    30, 0.2000);
