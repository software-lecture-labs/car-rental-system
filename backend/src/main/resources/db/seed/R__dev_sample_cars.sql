-- SADECE dev profilinde çalışır (application-dev.yml). Frontend geliştirirken boş liste görmemek için.
-- Repeatable migration (R__): içerik değişirse Flyway tekrar çalıştırır, o yüzden idempotent yazıldı.
INSERT INTO cars (brand, model, production_year, fuel_type, transmission, color, plate, seat_count, daily_base_price, status) VALUES
    ('Renault',    'Clio',    2022, 'GASOLINE', 'MANUAL',    'Beyaz',    '34ABC123', 5, 1250.00, 'AVAILABLE'),
    ('Fiat',       'Egea',    2023, 'DIESEL',   'MANUAL',    'Gri',      '34DEF456', 5, 1400.00, 'AVAILABLE'),
    ('Toyota',     'Corolla', 2023, 'HYBRID',   'AUTOMATIC', 'Siyah',    '06GHJ789', 5, 2100.00, 'AVAILABLE'),
    ('Volkswagen', 'Passat',  2021, 'DIESEL',   'AUTOMATIC', 'Lacivert', '35KLM012', 5, 2600.00, 'MAINTENANCE'),
    ('Tesla',      'Model Y', 2024, 'ELECTRIC', 'AUTOMATIC', 'Kırmızı',  '34TSL24',  5, 3500.00, 'AVAILABLE')
ON CONFLICT (plate) DO NOTHING;
