# PANDORA-RO 1.0-4.0 — Web

เว็บ pre-register / การตลาดของเซิร์ฟ PANDORA-RO (Ragnarok Classic Ep 1.0-4.0, low rate)
แผนทั้งหมดอยู่ที่ [docs/PLAN.md](docs/PLAN.md)

## Stack

- Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4
- Prisma 7 + MySQL (driver adapter `@prisma/adapter-mariadb`)
- Auth.js v5 (Google, Discord) · next-intl (th / en)
- npm workspaces: `apps/web`, `packages/shared` (สัญญา SyncJob ที่ใช้ร่วมกับ sync agent)

## เริ่มใช้งานในเครื่อง

ต้องมี Node 22+ และ MySQL 8 (หรือ MariaDB) รันอยู่ในเครื่อง

1. สร้างฐานข้อมูลเปล่า:
   ```sql
   CREATE DATABASE pandora_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. ติดตั้ง:
   ```bash
   npm install
   ```
3. แก้ `apps/web/.env` (คัดลอกจาก `apps/web/.env.example`) ใส่ `DATABASE_URL` และ key ของ Google/Discord
4. สร้างตารางและข้อมูลเริ่มต้น:
   ```bash
   npm run db:migrate -- --name init
   ```
   ```bash
   npm run db:seed
   ```
5. รัน:
   ```bash
   npm run dev
   ```
   เปิด http://localhost:3000

### OAuth redirect URIs (ตอน dev)

- Google: `http://localhost:3000/api/auth/callback/google`
- Discord: `http://localhost:3000/api/auth/callback/discord`

## โครงสร้าง

```
apps/web/src/
├─ app/[locale]/     หน้าเว็บ (th/en)
├─ app/api/          route handlers (auth, sync ในอนาคต)
├─ core/             auth, db, i18n, seo, events, settings, ui — ใช้ร่วมทุก module
├─ modules/          preregister, points, quests, … — คุยกันผ่าน core/events
└─ messages/         ข้อความแปล th.json / en.json
```

กฎ: module ห้าม import ไส้ในของ module อื่น ให้ใช้ event (`core/events`) หรือ service ที่ export ออกมา
