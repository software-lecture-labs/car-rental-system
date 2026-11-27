# RentACar frontend

Next.js 16.4 (App Router, TypeScript strict) ile yazılmış arayüz. Backend'e dokunmaz; `backend/` altındaki
Spring Boot API'sini kullanır.

## Çalıştırma

```bash
cd frontend
cp .env.example .env.local   # BACKEND_URL'i kontrol et
npm ci
npm run dev                  # http://localhost:3000
```

Backend `http://localhost:8080` adresinde dev profiliyle çalışıyor olmalı (5 örnek araç ve
`admin@rentacar.com` / `Admin12345` yönetici hesabı dev profiliyle gelir).

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi ve çalıştırma |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route tiplerini üretir, `tsc --noEmit` çalıştırır |
| `npm test` | Saf fonksiyonların birim testleri (Vitest) |
