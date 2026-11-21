import "server-only";
import { prisma } from "@/core/db/prisma";

/** Defaults used when a key isn't in the DB yet (or the DB is unreachable at build). */
export const SETTING_DEFAULTS = {
  "site.launch": { cbtAt: null as string | null, obtAt: null as string | null },
  "site.links": { discord: "", facebook: "", tiktok: "", youtube: "" },
  "site.maintenance": false,
  /** Public pixel / measurement IDs (not secrets). The CAPI token lives in env. */
  tracking: { metaPixelId: "", ga4Id: "", tiktokPixelId: "" },
  /** Prize text shown on the referral leaderboard page */
  leaderboard: { prizeTh: "", prizeEn: "" },
  /** Anti-fraud limits. 0 = off. Net cafés share one IP, so keep this generous. */
  fraud: { maxSignupsPerIp24h: 10 },
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

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type SettingValue<K extends SettingKey> = (typeof SETTING_DEFAULTS)[K];

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    if (row) return row.value as SettingValue<K>;
  } catch (err) {
    console.warn(`[settings] could not read "${key}", using default`, (err as Error).message);
  }
  return SETTING_DEFAULTS[key];
}
