/**
 * Sample news posts that show every way a post can look (all categories,
 * every Markdown feature, cover / no cover, scheduled, draft, Thai-only,
 * enough posts for pagination). All slugs start with "sample-".
 *
 *   npm run news:sample -w web            add / refresh the samples
 *   npm run news:sample -w web -- --remove delete them again
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, type NewsCategory } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!.replace(/^mysql:\/\//, "mariadb://")) });

const DAY = 86_400_000;
const ago = (days: number, hour = 12) => {
  const d = new Date(Date.now() - days * DAY);
  d.setUTCHours(hour - 7, 0, 0, 0); // hour in Thai time
  return d;
};

type L = { th: string; en: string };
interface Sample {
  slug: string;
  category: NewsCategory;
  title: L;
  excerpt?: L;
  content: L;
  coverImage?: string;
  seoTitle?: L;
  seoDesc?: L;
  isPublished: boolean;
  publishedAt: Date | null;
}

const samples: Sample[] = [
  // 1 ─ Flagship news: every Markdown feature, cover, custom SEO
  {
    slug: "sample-preregister-open",
    category: "NEWS",
    coverImage: "/news/sample/preregister.svg",
    title: { th: "เปิดลงทะเบียนล่วงหน้า PANDORA-RO แล้ววันนี้!", en: "PANDORA-RO pre-registration is now open!" },
    excerpt: {
      th: "ลงทะเบียนวันนี้รับกล่องแพนโดร่าฟรี ยิ่งคนสมัครมาก โซ่ยิ่งแตก ของรางวัลยิ่งเยอะสำหรับทุกคน",
      en: "Register today for a free Pandora box. The more players sign up, the more chains break — and the bigger the rewards for everyone.",
    },
    seoTitle: { th: "ลงทะเบียนล่วงหน้า PANDORA-RO รับของฟรี", en: "Pre-register for PANDORA-RO — free rewards" },
    seoDesc: {
      th: "เซิร์ฟ Ragnarok Classic Ep 1.0-4.0 Low Rate เปิดให้ลงทะเบียนล่วงหน้าแล้ว รับกล่องแพนโดร่าและของรางวัลตามเป้าผู้สมัคร",
      en: "Ragnarok Classic Ep 1.0-4.0 low-rate server — pre-register now for a Pandora box and milestone rewards.",
    },
    isPublished: true,
    publishedAt: ago(1, 18),
    content: {
      th: `สวัสดีนักผจญภัยทุกคน! วันนี้เราเปิดให้ **ลงทะเบียนล่วงหน้า** อย่างเป็นทางการแล้ว
ลงทะเบียนครั้งเดียวด้วย Google หรือ Discord ไม่ต้องตั้งรหัสผ่าน

## รับอะไรบ้าง

- กล่องแพนโดร่า 1 กล่องสำหรับทุกคนที่ลงทะเบียน
- ของรางวัลเพิ่มตาม **เป้าจำนวนผู้สมัคร** ของทั้งเซิร์ฟ
- แต้มสะสมจากภารกิจ เอาไปแลก *ของตกแต่ง* ได้ตอนเปิดเซิร์ฟ

## ขั้นตอน

1. กดปุ่ม "ลงทะเบียนรับกล่อง" ที่หน้าแรก
2. เข้าสู่ระบบด้วย Google หรือ Discord
3. ผูก Discord และเข้าเซิร์ฟ Discord เพื่อรับแต้มเพิ่ม
4. แชร์ลิงก์ชวนเพื่อน รับแต้มทุกครั้งที่เพื่อนเข้า Discord

> ของรางวัลทั้งหมดเป็นของตกแต่งและของช่วยความสะดวก ไม่กระทบสมดุลของเซิร์ฟ Low Rate

![แผนที่เมืองเริ่มต้น Prontera](/news/sample/inline-map.svg)

### ลิงก์ที่เกี่ยวข้อง

ดูอันดับนักชวนเพื่อนได้ที่ [หน้าอันดับ](/th/leaderboard) และพูดคุยกับทีมงานได้ที่ [Discord](https://discord.com)
รหัสชวนเพื่อนของคุณจะอยู่ในหน้า "กล่องของฉัน" เช่น \`PANDA123\`

---

แล้วพบกันในวันเปิดเซิร์ฟ — ทีมงาน PANDORA-RO`,
      en: `Hello adventurers! **Pre-registration** is officially open.
Sign up once with Google or Discord — no password needed.

## What you get

- One Pandora box for everyone who registers
- Extra rewards as the whole server hits **sign-up milestones**
- Quest points you can trade for *cosmetics* at launch

## How to join

1. Press "Claim my box" on the home page
2. Sign in with Google or Discord
3. Link Discord and join our server for bonus points
4. Share your invite link — earn points whenever a friend joins Discord

> Every reward is cosmetic or convenience only. Nothing breaks low-rate balance.

![Prontera, the starting town](/news/sample/inline-map.svg)

### Useful links

Check the [inviter leaderboard](/en/leaderboard) and chat with the team on [Discord](https://discord.com).
Your invite code is on the "My Box" page, e.g. \`PANDA123\`

---

See you at launch — the PANDORA-RO team`,
    },
  },

  // 2 ─ Patch notes: nested headings, ordered lists, inline code
  {
    slug: "sample-patch-0-9",
    category: "PATCH",
    coverImage: "/news/sample/patch.svg",
    title: { th: "Patch Note 0.9 — CBT Build", en: "Patch Notes 0.9 — CBT Build" },
    excerpt: { th: "ปรับสมดุลอาชีพสายเวท แก้บั๊กปาร์ตี้ และปรับอัตราดรอปการ์ด", en: "Mage-class balance, party bug fixes and card drop rate changes." },
    isPublished: true,
    publishedAt: ago(3, 10),
    content: {
      th: `## ปรับสมดุล

### Mage / Wizard
- Fire Bolt ดาเมจ +5% ที่เลเวลสกิล 10
- Storm Gust ดีเลย์หลังร่าย **ลดลง 0.5 วินาที**

### Knight
- Bowling Bash ไม่ทะลุกำแพงอีกต่อไป

## แก้ไขบั๊ก

1. แก้ปัญหาแชร์ EXP ปาร์ตี้ไม่เท่ากันเมื่อเลเวลห่างเกิน 10
2. แก้ NPC Kafra ที่ Payon วาร์ปผิดแผนที่
3. แก้คำสั่ง \`@autoloot\` ไม่บันทึกค่าหลังรีล็อก

## อัตราดรอป

- การ์ดบอส: 0.01% (เท่า Official)
- การ์ดมอนปกติ: 0.02%

> ⚠️ ตัวละครใน CBT จะถูกล้างทั้งหมดก่อน OBT`,
      en: `## Balance

### Mage / Wizard
- Fire Bolt damage +5% at skill level 10
- Storm Gust after-cast delay **reduced by 0.5s**

### Knight
- Bowling Bash no longer passes through walls

## Bug fixes

1. Fixed uneven party EXP share when level gap is over 10
2. Fixed Payon Kafra warping to the wrong map
3. Fixed \`@autoloot\` not saving after relog

## Drop rates

- Boss cards: 0.01% (official)
- Normal cards: 0.02%

> ⚠️ All CBT characters will be wiped before OBT`,
    },
  },

  // 3 ─ Guide: long read, rendered as BlogPosting
  {
    slug: "sample-guide-first-job",
    category: "GUIDE",
    coverImage: "/news/sample/guide.svg",
    title: { th: "คู่มือมือใหม่: เลือกอาชีพแรกให้เหมาะกับคุณ", en: "Beginner guide: choosing your first job" },
    excerpt: { th: "เปรียบเทียบ 6 อาชีพแรก จุดเด่น จุดด้อย และสายอัพที่แนะนำสำหรับเซิร์ฟ Low Rate", en: "The six first jobs compared — strengths, weaknesses and recommended builds for a low-rate server." },
    isPublished: true,
    publishedAt: ago(5, 20),
    content: {
      th: `เซิร์ฟ Low Rate ใช้เวลาเก็บเลเวลนาน การเลือกอาชีพแรกให้ถูกใจจึงสำคัญมาก

## Swordman — ถึก ตีแรง
เหมาะกับคนชอบลุยหน้า เลือดเยอะ เก็บเลเวลคนเดียวได้สบาย
**แนะนำ:** STR / VIT

## Mage — ดาเมจเวทแรง
ฆ่ามอนเป็นกลุ่มได้เร็ว แต่ตัวบาง ต้องระวังโดนรุม
**แนะนำ:** INT / DEX

## Archer — ยิงไกล ปลอดภัย
เก็บเลเวลง่ายที่สุดสำหรับมือใหม่ ใช้ลูกธนูเยอะหน่อย
**แนะนำ:** DEX / AGI

## Acolyte — สายซัพพอร์ต
ทุกปาร์ตี้ต้องการ ฮีลและบัฟ เก็บเลเวลคนเดียวช้า
**แนะนำ:** INT / VIT

## Merchant — สายเงิน
ซื้อถูกขายแพง เปิดร้านได้ เหมาะกับคนชอบเทรด

## Thief — เร็ว หลบเก่ง
หลบการโจมตีเก่ง ปล้นของจากมอนได้

---

### สรุปสั้น ๆ
- อยากเล่นคนเดียว → **Swordman** หรือ **Archer**
- อยากอยู่ปาร์ตี้ → **Acolyte**
- อยากรวย → **Merchant**

อ่านกฎของเซิร์ฟเพิ่มเติมได้ที่ [หน้าแรก](/th)`,
      en: `Levelling is slow on a low-rate server, so picking a first job you enjoy matters.

## Swordman — tough melee
Great for players who like the front line. High HP, easy solo levelling.
**Build:** STR / VIT

## Mage — big magic damage
Clears groups fast but fragile — don't get surrounded.
**Build:** INT / DEX

## Archer — safe ranged
The easiest solo levelling for beginners. Uses a lot of arrows.
**Build:** DEX / AGI

## Acolyte — support
Every party wants one. Heals and buffs, slow solo.
**Build:** INT / VIT

## Merchant — money maker
Buy low, sell high, open a shop. For traders.

## Thief — fast and evasive
Dodges hits well and can steal from monsters.

---

### TL;DR
- Want to solo → **Swordman** or **Archer**
- Want to party → **Acolyte**
- Want to get rich → **Merchant**

More about the server on the [home page](/en)`,
    },
  },

  // 4 ─ Event
  {
    slug: "sample-event-invite",
    category: "EVENT",
    coverImage: "/news/sample/event.svg",
    title: { th: "กิจกรรมชวนเพื่อน ลุ้นกล่องแพนโดร่าทองคำ", en: "Invite friends, win a golden Pandora box" },
    excerpt: { th: "ติด 3 อันดับแรกของสัปดาห์ รับกล่องแพนโดร่าทองคำพร้อมยศพิเศษใน Discord", en: "Finish top 3 of the week to win a golden Pandora box and a special Discord role." },
    isPublished: true,
    publishedAt: ago(7, 9),
    content: {
      th: `## กติกา
- นับเฉพาะเพื่อนที่ลงทะเบียนผ่านลิงก์ของคุณ **และเข้า Discord แล้ว**
- ตัดยอดทุกวันจันทร์ 00:00 น. (เวลาไทย)
- ห้ามสร้างบัญชีปลอม — ระบบตรวจ IP และเครื่องซ้ำ

## ของรางวัล
1. อันดับ 1: กล่องแพนโดร่าทองคำ + ยศ **Pandora Hunter**
2. อันดับ 2: กล่องแพนโดร่าเงิน
3. อันดับ 3: กล่องแพนโดร่าทองแดง

ดูอันดับสด ๆ ได้ที่ [หน้าอันดับ](/th/leaderboard)`,
      en: `## Rules
- Only friends who register through your link **and join Discord** count
- Resets every Monday 00:00 (Thailand time)
- No fake accounts — duplicate IPs and devices are checked

## Prizes
1. 1st: Golden Pandora box + **Pandora Hunter** role
2. 2nd: Silver Pandora box
3. 3rd: Bronze Pandora box

Live standings on the [leaderboard](/en/leaderboard)`,
    },
  },

  // 5 ─ No cover, no excerpt, Thai only (English falls back to Thai; meta description comes from the body)
  {
    slug: "sample-maintenance-thai-only",
    category: "NEWS",
    title: { th: "แจ้งปิดปรับปรุงเว็บไซต์ชั่วคราว (ตัวอย่าง: ไม่มีรูปปก / ไม่มีภาษาอังกฤษ)", en: "" },
    isPublished: true,
    publishedAt: ago(9, 2),
    content: {
      th: `เว็บไซต์จะปิดปรับปรุงในวันพุธ เวลา 02:00 - 04:00 น.
ระหว่างนี้จะลงทะเบียนและดูกล่องของฉันไม่ได้ชั่วคราว

ข่าวนี้ไม่มีรูปปกและไม่มีภาษาอังกฤษ — หน้าภาษาอังกฤษจะแสดงภาษาไทยแทน`,
      en: "",
    },
  },

  // 6 ─ Scheduled: published but in the future → hidden from players until then
  {
    slug: "sample-scheduled-cbt-date",
    category: "NEWS",
    coverImage: "/news/sample/preregister.svg",
    title: { th: "ประกาศวันเปิด CBT (ตั้งเวลาไว้ — ผู้เล่นยังไม่เห็น)", en: "CBT date announcement (scheduled — not visible yet)" },
    excerpt: { th: "ข่าวนี้ตั้งเวลาเผยแพร่ล่วงหน้า 3 วัน", en: "This post is scheduled 3 days ahead." },
    isPublished: true,
    publishedAt: new Date(Date.now() + 3 * DAY),
    content: { th: "ข่าวนี้จะแสดงอัตโนมัติเมื่อถึงเวลาที่ตั้งไว้", en: "This post goes live automatically at the scheduled time." },
  },

  // 7 ─ Draft: only visible in admin
  {
    slug: "sample-draft-roadmap",
    category: "GUIDE",
    title: { th: "Roadmap Episode 1.0 - 4.0 (ฉบับร่าง — ผู้เล่นไม่เห็น)", en: "Episode 1.0 - 4.0 roadmap (draft — not visible)" },
    isPublished: false,
    publishedAt: null,
    content: { th: "ฉบับร่าง ยังไม่เผยแพร่", en: "Draft, not published" },
  },
];

// 8+ ─ Short older announcements so the list has a second page (12 per page)
const shorts: [NewsCategory, string, string][] = [
  ["NEWS", "เปิดเซิร์ฟ Discord อย่างเป็นทางการ", "Official Discord server is open"],
  ["EVENT", "กิจกรรมตั้งชื่อกิลด์แรกของเซิร์ฟ", "Name the first guild contest"],
  ["PATCH", "Patch Note 0.8 — Alpha Build", "Patch Notes 0.8 — Alpha Build"],
  ["GUIDE", "วิธีผูก Discord กับบัญชี", "How to link Discord to your account"],
  ["NEWS", "เปิดตัวเว็บไซต์ PANDORA-RO", "PANDORA-RO website launch"],
  ["GUIDE", "คำถามที่พบบ่อยเรื่องการลงทะเบียนล่วงหน้า", "Pre-registration FAQ"],
  ["NEWS", "ทีมงานเปิดรับ GM อาสา", "We are recruiting volunteer GMs"],
  ["EVENT", "แจกยศพิเศษ 1,000 คนแรกใน Discord", "Special role for the first 1,000 Discord members"],
];
shorts.forEach(([category, th, en], i) =>
  samples.push({
    slug: `sample-archive-${i + 1}`,
    category,
    title: { th, en },
    excerpt: { th: `ข่าวสั้นตัวอย่างลำดับที่ ${i + 1} สำหรับแสดงการแบ่งหน้า`, en: `Short sample post #${i + 1} to show pagination` },
    content: { th: `${th}\n\nข่าวสั้นตัวอย่างสำหรับแสดงการแบ่งหน้า`, en: `${en}\n\nShort sample post to show pagination` },
    isPublished: true,
    publishedAt: ago(12 + i * 3, 11),
  }),
);

const optional = (v?: L) => (v ? v : undefined);

async function main() {
  if (process.argv.includes("--remove")) {
    const { count } = await prisma.newsPost.deleteMany({ where: { slug: { startsWith: "sample-" } } });
    console.log(`Removed ${count} sample posts.`);
    return;
  }
  for (const s of samples) {
    const data = {
      category: s.category,
      title: s.title,
      excerpt: optional(s.excerpt),
      content: s.content,
      coverImage: s.coverImage ?? null,
      seoTitle: optional(s.seoTitle),
      seoDesc: optional(s.seoDesc),
      isPublished: s.isPublished,
      publishedAt: s.publishedAt,
    };
    await prisma.newsPost.upsert({ where: { slug: s.slug }, update: data, create: { slug: s.slug, ...data } });
  }
  console.log(`Upserted ${samples.length} sample posts (slugs start with "sample-").`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
