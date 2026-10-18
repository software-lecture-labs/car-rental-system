-- Sistemdeki tüm kullanıcılar (ADMIN + CUSTOMER).
-- "user" PostgreSQL'de rezerve kelime olduğu için tablo adı "users".
CREATE TABLE users (
    id          UUID          PRIMARY KEY DEFAULT uuidv7(),
    first_name  VARCHAR(50)   NOT NULL,
    last_name   VARCHAR(50)   NOT NULL,
    email       VARCHAR(255)  NOT NULL,
    password    VARCHAR(100)  NOT NULL,  -- BCrypt hash; düz metin şifre ASLA yazılmaz
    role        VARCHAR(20)   NOT NULL,
    CONSTRAINT ck_users_role CHECK (role IN ('ADMIN', 'CUSTOMER'))
);

-- Büyük/küçük harf duyarsız benzersiz e-posta: Ali@x.com ile ali@x.com aynı hesap sayılır
CREATE UNIQUE INDEX ux_users_email_lower ON users (lower(email));
