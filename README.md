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

### บัญชีแอดมิน (หลังบ้าน)

บัญชีทีมงานแยกจากบัญชีผู้เล่น ล็อกอินด้วยชื่อผู้ใช้ + รหัสผ่าน (ไม่ใช้ Google/Discord) ที่ http://localhost:3000/admin/login

สร้าง Super Admin คนแรก — **เปลี่ยน `yourname` เป็นชื่อผู้ใช้ที่จะใช้ล็อกอินจริง** (a-z 0-9 . _ -) และ `"Your Name"` เป็นชื่อที่แสดง ระบบจะพิมพ์รหัสผ่านชั่วคราวให้ 1 ครั้ง และบังคับเปลี่ยนตอนเข้าครั้งแรก:

```bash
npm run admin:create -w web -- yourname SUPER_ADMIN "Your Name"
```

คนอื่นสร้างจากเมนู **บัญชีแอดมิน** ในหลังบ้าน · ถ้าลืมรหัสหรือโดนล็อก รันคำสั่งเดิมกับชื่อผู้ใช้นั้นเพื่อรีเซ็ต

- สิทธิ์: `SUPER_ADMIN` (ทุกเมนู + จัดการแอดมิน), `ADMIN` (ทุกเมนู), `EDITOR` (ข่าวเท่านั้น)
- ใส่รหัสผิด 5 ครั้งติด → ล็อก 15 นาที · IP เดียวผิดเกิน 20 ครั้งใน 15 นาที → บล็อก
- เซสชันหมดอายุเมื่อไม่ใช้งาน 2 ชม. หรือครบ 12 ชม.
- **ประวัติเข้าระบบ**: ทุกการล็อกอิน (สำเร็จ/ไม่สำเร็จ + เหตุผล) และออกจากระบบ พร้อม IP และเบราว์เซอร์
- **Audit Log**: ทุกการเพิ่ม/ลบ/แก้ไข เก็บค่าก่อน → หลัง, ใครทำ, IP

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
