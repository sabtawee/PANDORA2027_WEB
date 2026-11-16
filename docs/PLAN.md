# PANDORA-RO 1.0-4.0 — แผนระบบเว็บ (Approved)

> สถานะ: อนุมัติแผนแล้ว · อัปเดตล่าสุด 2026-11-16

## 0. สรุปการตัดสินใจ

| หัวข้อ | ข้อสรุป |
|---|---|
| Stack | Next.js 15 (App Router) + Prisma + MySQL, monorepo (pnpm workspace) |
| Emulator | **rAthena** (pre-renewal, Episode 1.0-4.0) |
| Rate | **Low rate** → ของรางวัลเน้น cosmetic/สะดวก ไม่ทำลายสมดุล |
| DB | แยก DB: `pandora_web` (Prisma) กับ `ragnarok` (rAthena) ต่างเครื่องกัน เชื่อมด้วย **sync agent** |
| SSO | **Google + Discord** |
| ภาษา | ไทย / อังกฤษ (`/th`, `/en`) |
| ตั้งค่า | ทุกอย่างตั้งค่าผ่าน **Admin backoffice** |
| SEO | ทำตั้งแต่เฟสแรก |
| งานภาพ | ยังไม่มี → เริ่มด้วยดีไซน์ที่ไม่ต้องพึ่งภาพวาด, จ้างโลโก้/key art คู่ขนาน |
| โดเมน | ยังไม่มี (ควรจดให้เร็ว เพื่อเริ่มนับอายุโดเมนสำหรับ SEO) |
| Hosting | พัฒนาในเครื่องตัวเองก่อน (Docker Compose) |

---

## 1. ภาพรวมระบบ

```
┌──────────── Web Server ────────────┐        ┌──────── Game Server ────────┐
│ Next.js (หน้าเว็บ /th /en)          │        │ rAthena (login/char/map)    │
│  ├─ Admin backoffice               │ HTTPS  │ MySQL: ragnarok             │
│  └─ Sync API (/api/sync/*)  ◄──────┼────────┼── Sync Agent (Node script)  │
│ MySQL: pandora_web (Prisma)        │  poll  │   อ่าน/เขียน DB เกมในเครื่อง  │
└────────────────────────────────────┘        └─────────────────────────────┘
```

- Agent ฝั่งเกมเป็นฝ่าย **ดึงงาน** จากเว็บ → ไม่ต้องเปิดพอร์ต MySQL เกมออก internet
- เว็บไม่แตะ DB เกมโดยตรง

---

## 2. Sync Web ⇄ Game

### Web → Game (outbox pattern, ตาราง `SyncJob`)

| Job | ใช้ตอน |
|---|---|
| `CREATE_GAME_ACCOUNT` | สร้าง ID เกม → insert ตาราง `login` |
| `CHANGE_PASSWORD` | เปลี่ยนรหัสเกม |
| `DELIVER_REWARD` | ส่งของผ่าน RoDEX (`mail`, `mail_attachments`) |
| `BAN` / `UNBAN` | admin สั่ง |

- Agent poll `GET /api/sync/jobs` ทุก 5-10 วิ → ทำใน transaction → `POST /api/sync/jobs/:id/ack`
- ยืนยันตัว: API key + HMAC signature + IP allowlist
- ทุก job มี **idempotency key** (ทำซ้ำไม่เบิ้ล), retry แบบ backoff, เกิน N ครั้ง → หน้า admin ให้กด retry
- **รหัสผ่านเกม** เข้ารหัสด้วย public key ของ agent ตั้งแต่ฝั่งเว็บ (sealed box) → agent ถอดแล้ว hash ตาม config rAthena (`use_MD5_passwords`) → DB เว็บไม่เคยมีรหัสเกมแบบอ่านได้

### Game → Web (หลังเปิดเซิร์ฟ)
- สถานะเซิร์ฟ/คนออนไลน์ ทุก 1 นาที
- Ranking (level, job, guild, WoE) ทุก 10-15 นาที
- ข้อมูลตัวละคร/การ login ครั้งแรก (ใช้ตรวจ referral ขั้น "เข้าเกมจริง")

---

## 3. โครงสร้างโค้ด (Core + Modules)

```
pandora-web/
├─ apps/web/src/
│  ├─ app/[locale]/        หน้าเว็บ th/en
│  ├─ app/admin/           backoffice (noindex)
│  ├─ app/api/sync/        endpoint สำหรับ agent
│  ├─ core/
│  │  ├─ auth/             Auth.js v5 (Google, Discord)
│  │  ├─ db/               Prisma client
│  │  ├─ i18n/             next-intl
│  │  ├─ seo/              metadata, JSON-LD, sitemap
│  │  ├─ events/           event bus ภายใน
│  │  ├─ settings/         ค่าตั้งจาก DB (cache)
│  │  ├─ tracking/         UTM, Pixel, Conversions API
│  │  ├─ rbac/             user / editor / gm / admin
│  │  └─ security/         rate limit, Turnstile, fingerprint
│  └─ modules/
│     ├─ preregister/      สมัคร + milestone กล่องแพนโดร่า
│     ├─ points/           ledger แต้ม
│     ├─ quests/           ภารกิจ (สร้างจาก admin)
│     ├─ referral/         ลิงก์เชิญ
│     ├─ rewards/          รางวัล + การรับของ
│     ├─ news/             ข่าว / patch note / guide
│     ├─ share/            ปุ่มแชร์ + รูป OG อัตโนมัติ
│     ├─ game-account/     สร้าง/ผูก ID เกม (ผ่าน SyncJob)
│     └─ ranking/          (หลังเปิดเซิร์ฟ)
├─ apps/sync-agent/        Node script รันบนเครื่องเกม
├─ packages/shared/        type/contract ของ SyncJob ใช้ร่วมกัน
└─ docker-compose.yml      dev: MySQL web + MySQL rAthena (ทดสอบ)
```

- Module คุยกันผ่าน event ของ core (เช่น `user.registered`, `discord.joined`) ไม่ import ข้ามกันตรงๆ
- เปิด/ปิด module ได้จาก Site Settings

---

## 4. SSO

- **Google**: ได้ email ไว้ส่งข่าว + ใช้ match กับ Conversions API
- **Discord**: scope `identify email guilds.join` → พาเข้าเซิร์ฟ Discord อัตโนมัติ + bot ให้ยศ "Pre-Register / Founder"
- 1 บัญชีเว็บผูกได้ทั้ง 2 provider
- Cloudflare Turnstile ก่อนสมัคร

---

## 5. ระบบกิจกรรมและแต้ม

### ✅ เฟส 1 (เปิดพร้อม pre-reg)

| ภารกิจ | แต้ม (default) | หมายเหตุ |
|---|---|---|
| สมัครสมาชิก | 100 | ได้ทันที |
| ผูก Discord + เข้าเซิร์ฟ Discord | 50 | ตรวจผ่าน Discord API (guild member) |
| ชวนเพื่อนสมัคร | 100 | เริ่มเป็น `pending` → `qualified` เมื่อเพื่อน **ผูก Discord + เข้าเซิร์ฟ Discord** แล้ว |

> เนื่องจากเฟส 1 ไม่มีเช็คอินรายวัน จึงใช้ "เพื่อนเข้า Discord" เป็นเงื่อนไขยืนยันว่าเป็นคนจริง (กันบัญชีปลอม) — ปรับเงื่อนไขได้จาก admin

### ⏳ เฟสถัดไป
- เช็คอินรายวัน (10/วัน, streak 7 วัน +50)
- เพื่อนที่ชวนเข้าเกมจริงตอนเปิด (+200, ตรวจผ่าน sync agent)
- Quiz ประจำสัปดาห์ (20-50)
- ภารกิจในเกม (เช่น เลเวลถึง X)

### หลักการ
- แต้มเก็บแบบ **ledger** (ทุกรายการมี amount, reason, refId) ไม่เก็บยอดเดียวบวกทับ
- ทุกค่าแต้ม/เงื่อนไขแก้ได้จาก admin

### รางวัล (เหมาะกับ low rate)
1. **Milestone ส่วนรวม** — กล่องแพนโดร่าล็อกโซ่ ครบเป้าคนสมัคร (เช่น 1k/3k/5k/10k/20k) โซ่แตก ทุกคนได้รางวัลขั้นนั้น
2. **Tier ส่วนตัว** ตามแต้ม (Bronze/Silver/Gold/Pandora)
- แนวของรางวัล: costume headgear, ยา/ของสิ้นเปลืองเล็กน้อยช่วงเริ่ม, Butterfly Wing/Fly Wing, ฉายา "Founder", ช่องเก็บของ — **ไม่แจกอุปกรณ์/การ์ดที่กระทบสมดุล**
- ส่งของตอนเปิดเซิร์ฟผ่าน `DELIVER_REWARD` → RoDEX, รับได้ **1 ครั้งต่อ web account**

### กันโกง
- Turnstile, rate limit, device fingerprint/IP, referral ต้อง qualified ก่อนได้แต้ม, หน้า Fraud Review ใน admin

---

## 6. Like & Share

- ปุ่มติดตามเพจ FB / เข้า Discord / Share วางเด่น แต่ **ไม่ให้แต้มกับการกด Like** (ผิดนโยบาย Facebook และตรวจสอบไม่ได้)
- Share ทุกครั้งแนบ **ลิงก์ referral ส่วนตัว** (`/th?ref=AB12CD`) → ให้แต้มเมื่อมีคนสมัครจริง
- ช่องทาง: Facebook, Messenger, LINE, X, Discord, copy link
- **รูปแชร์อัตโนมัติ** (`next/og`) — ชื่อผู้ใช้ + ระดับกล่อง + จำนวนวันก่อนเปิด (th/en)
- Leaderboard นักชวนเพื่อน (รางวัลตั้งจาก admin)

---

## 7. Admin Backoffice

| เมนู | รายละเอียด |
|---|---|
| Dashboard | คนสมัครรายวัน, แยก UTM/แคมเปญ, referral สูงสุด |
| Site Settings | countdown CBT/OBT, เปิด/ปิด module, ลิงก์ social, maintenance |
| Milestones | เป้า, รางวัล, รูป, ข้อความ th/en |
| Quests | ประเภท, แต้ม, ช่วงเวลา, จำนวนครั้ง |
| Point Rules | แต้มสมัคร/referral/Discord, เงื่อนไข qualified, ช่วง x2 |
| Reward Tiers | แต้มที่ใช้ + item ที่ได้ |
| Item Catalog | import `item_db` ของ rAthena → เลือกไอเทมจาก dropdown |
| News | editor 2 ภาษา, ตั้งเวลา, หมวด (ข่าว/patch/guide/event), ช่อง SEO |
| Landing Pages | สร้าง landing ต่อแคมเปญ (A/B test) |
| SEO | title/description/OG ต่อหน้าต่อภาษา, redirect |
| Users | ค้นหา, ประวัติแต้ม, ปรับแต้ม (บังคับใส่เหตุผล), แบน |
| Fraud Review | IP/device ซ้ำ, referral ผิดปกติ |
| Sync Monitor | สถานะ agent, คิว job, retry |
| Audit Log | บันทึกทุกการแก้ใน admin |

ข้อความ 2 ภาษาเก็บเป็น JSON `{ "th": "...", "en": "..." }` (en ว่าง → fallback th)

---

## 8. SEO

### Technical
- `/th`, `/en` (next-intl) + `x-default`; ไม่ redirect bot
- hreflang + canonical ทุกหน้า
- `sitemap.xml` dynamic (รวมข่าว 2 ภาษา) + `robots.txt`
- SSG/ISR สำหรับ landing/ข่าว → Core Web Vitals ดี
- `noindex`: dashboard, admin, URL ที่มี `?ref=` (canonical กลับหน้าหลัก)
- `next/image` (WebP/AVIF), `next/font` self-host (Kanit / Noto Sans Thai / Cinzel)

### Structured Data (JSON-LD)
`Organization`, `WebSite`, `VideoGame`, `NewsArticle`/`BlogPosting`, `FAQPage`, `BreadcrumbList`

### Content
- Keyword TH: เซิฟ RO เปิดใหม่, Ragnarok Classic เซิฟใหม่, เซิฟ RO Ep 4, RO คลาสสิค 2027, เซิฟ RO low rate
- Keyword EN: new Ragnarok classic private server, pre-renewal low rate server 2027
- Guide long-tail: สายอาชีพมือใหม่, เส้นทางเก็บเลเวล, ความต่าง Ep 1.0-4.0
- FAQ: เรท, วันเปิด, สเปคเครื่อง, ระบบเติมเงิน

### Tools
Google Search Console, Bing Webmaster, GA4

> ใช้คำว่า Ragnarok ในเนื้อหาได้ แต่แบรนด์/โลโก้เป็นของ PANDORA เอง และไม่ใช้ภาพทางการของ Gravity

---

## 9. แอดและการวัดผล

- Meta Pixel + **Conversions API** (`CompleteRegistration` จาก server + hashed email)
- Google Ads + GA4, TikTok Pixel + Events API
- เก็บ UTM / `fbclid` / `gclid` / `ttclid` first-touch ลง DB
- Landing ต่อแคมเปญจาก admin
- Cookie consent ตาม PDPA (ไม่โหลด pixel ก่อนยินยอม)

---

## 10. ดีไซน์

- **คอนเซ็ปต์:** "เปิดกล่องแพนโดร่า" — กล่องล็อกโซ่ = milestone ของทั้งเซิร์ฟ
- **Tokens:** พื้น `#0B0812`, ทอง `#D4A84B`, ม่วง `#7B4BD4`, ขาวนวล
- **ฟอนต์:** Cinzel (หัวข้อ EN), Kanit / Noto Serif Thai (TH)
- **ช่วงยังไม่มีภาพ:** particle แสง, กล่อง 3D เรขาคณิต (CSS/Three.js), animation โซ่แตก
- **จ้างวาด (เริ่มสัปดาห์ 1):** โลโก้ → key art มาสคอต Pandora + กล่อง → ไอคอนรางวัล/tier → อาชีพ
- **หน้า:** Landing, Dashboard (แต้ม/ภารกิจ/กล่อง/ลิงก์เชิญ), Rewards, News, Guide, FAQ, Roadmap Ep 1.0-4.0, Download (ใกล้เปิด)

---

## 11. Timeline (~12 สัปดาห์)

| สัปดาห์ | งาน | ผลลัพธ์ |
|---|---|---|
| 1 | Monorepo, Docker Compose (local), Prisma schema, Auth Google/Discord, i18n, design tokens | ล็อกอินได้ในเครื่อง |
| 2 | Landing + countdown + milestone, quest เฟส 1 (สมัคร/Discord/referral), tracking, SEO พื้นฐาน, admin settings | **🚀 พร้อมเปิด pre-reg** (ต้องมีโดเมน + hosting) |
| 3-4 | Points ledger เต็ม, share + รูป OG, leaderboard | |
| 5-6 | Admin เต็มชุด, News CMS | ทีมจัดการเองได้ |
| 7 | กันโกง + fraud review, guide/FAQ | |
| 8-9 | Sync agent + SyncJob, สร้าง ID เกม, ทดสอบกับ rAthena local | |
| 10 | ส่งของผ่าน RoDEX, ใส่ key art | |
| 11 | Load test, security review, CBT | |
| 12 | OBT, เปิดรับของ, ranking | 🎮 เปิดเซิร์ฟ |

---

## 12. งานค้าง / ต้องตัดสินใจภายหลัง

- [ ] จดโดเมน
- [ ] เลือก hosting production (VPS + Docker หรือ Vercel + MySQL ภายนอก) — ก่อนสัปดาห์ 2
- [ ] ตรวจ config rAthena: `use_MD5_passwords`, เปิด RoDEX
- [ ] สร้าง Google OAuth app + Discord application/bot + Discord server
- [ ] จ้างนักวาด โลโก้ + key art
- [ ] รายการไอเทมรางวัล (milestone + tier)
