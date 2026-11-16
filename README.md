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

### ตั้งตัวเองเป็น admin

ล็อกอินเข้าเว็บ 1 ครั้งก่อน แล้วรัน (เปลี่ยนเป็นอีเมลของคุณ):

```bash
npm run admin:grant -w web -- you@example.com
```

จากนั้นเข้า http://localhost:3000/admin

### Discord (ภารกิจเข้าเซิร์ฟ)

1. สร้าง Bot ใน Discord Developer Portal (application เดียวกับ OAuth) แล้วเชิญเข้าเซิร์ฟด้วยสิทธิ์ **Create Invite** (+ **Manage Roles** ถ้าจะให้ยศ)
2. ใส่ `DISCORD_GUILD_ID`, `DISCORD_BOT_TOKEN` (และ `DISCORD_PREREG_ROLE_ID` ถ้ามี) ใน `.env`
3. ใส่ลิงก์เชิญ discord.gg ใน admin → ตั้งค่าเว็บ

เมื่อผู้เล่นผูก Discord ระบบจะพาเข้าเซิร์ฟให้อัตโนมัติและให้แต้ม ถ้าเพื่อนที่ถูกชวนเข้าเซิร์ฟ ผู้ชวนจะได้แต้ม referral

### Tracking

ใส่ Pixel ID / GA4 / TikTok ใน admin → ตั้งค่าเว็บ (โหลดเมื่อผู้ใช้กดยอมรับคุกกี้เท่านั้น)
Meta Conversions API ฝั่ง server ต้องใส่ `META_CAPI_TOKEN` ใน `.env`

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
