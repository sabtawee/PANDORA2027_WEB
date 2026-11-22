/**
 * Default data so admin starts with something to edit.
 * Run: npm run db:seed
 * Safe to re-run (upserts).
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient, QuestType } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL!.replace(/^mysql:\/\//, "mariadb://");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });

const quests = [
  {
    key: "signup",
    type: QuestType.SIGNUP,
    points: 100,
    title: { th: "สมัครสมาชิก", en: "Register an account" },
    description: { th: "รับแต้มทันทีเมื่อสมัคร", en: "Points awarded on sign-up" },
    sortOrder: 1,
  },
  {
    key: "discord-join",
    type: QuestType.DISCORD_JOIN,
    points: 50,
    title: { th: "ผูก Discord และเข้าเซิร์ฟ Discord", en: "Link Discord & join our server" },
    description: { th: "ตรวจสอบอัตโนมัติผ่าน Discord", en: "Verified automatically via Discord" },
    sortOrder: 2,
  },
  {
    key: "referral",
    type: QuestType.REFERRAL,
    points: 100,
    maxPerUser: 0,
    title: { th: "ชวนเพื่อนสมัคร", en: "Invite friends" },
    description: {
      th: "ได้แต้มเมื่อเพื่อนสมัครและเข้าเซิร์ฟ Discord",
      en: "Earn points when a friend registers and joins Discord",
    },
    config: { qualifyOn: "DISCORD_JOIN" },
    sortOrder: 3,
  },
];

const milestones = [1000, 3000, 5000, 10000, 20000].map((target, i) => ({
  target,
  sortOrder: i + 1,
  title: { th: `ปลดโซ่ขั้นที่ ${i + 1}`, en: `Chain ${i + 1} broken` },
  items: [],
}));

// Thresholds fit phase-1 quests: signup 100 + Discord 50, then +100 per qualified friend.
const tiers = [
  { key: "bronze", minPoints: 100, title: { th: "บรอนซ์", en: "Bronze" } },
  { key: "silver", minPoints: 250, title: { th: "ซิลเวอร์", en: "Silver" } },
  { key: "gold", minPoints: 650, title: { th: "โกลด์", en: "Gold" } },
  { key: "pandora", minPoints: 1150, title: { th: "แพนโดร่า", en: "Pandora" } },
].map((t, i) => ({ ...t, sortOrder: i + 1, items: [] }));

const settings: Record<string, unknown> = {
  "site.launch": { cbtAt: null, obtAt: "2027-02-14T12:00:00+07:00" },
  "site.links": { discord: "", facebook: "https://www.facebook.com/profile.php?id=61596098113174", tiktok: "", youtube: "" },
  "site.maintenance": false,
  tracking: { metaPixelId: "", ga4Id: "", tiktokPixelId: "" },
  "modules.enabled": {
    preregister: true,
    quests: true,
    referral: true,
    rewards: false,
    news: false,
    gameAccount: false,
    ranking: false,
  },
};

async function main() {
  for (const q of quests) {
    await prisma.quest.upsert({ where: { key: q.key }, update: {}, create: q });
  }
  for (const m of milestones) {
    await prisma.milestone.upsert({ where: { target: m.target }, update: {}, create: m });
  }
  for (const t of tiers) {
    await prisma.rewardTier.upsert({ where: { key: t.key }, update: {}, create: t });
  }
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as Prisma.InputJsonValue },
    });
  }
  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
