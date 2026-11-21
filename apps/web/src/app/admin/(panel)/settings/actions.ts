"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import { requireAdmin } from "@/core/admin/session";
import { SETTING_DEFAULTS, type SettingKey } from "@/core/settings";
import type { Prisma } from "@/generated/prisma/client";

/** datetime-local "2027-02-14T12:00" is entered in Thai time → ISO with +07:00. */
const bkkDateTime = z
  .string()
  .trim()
  .transform((v) => (v ? `${v.length === 16 ? `${v}:00` : v}+07:00` : null))
  .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "invalid date");

const url = z.union([z.literal(""), z.url().max(300)]);
const pixelId = z.string().trim().regex(/^[A-Za-z0-9-]{0,40}$/, "invalid id");

const schema = z.object({
  cbtAt: bkkDateTime,
  obtAt: bkkDateTime,
  discord: url,
  facebook: url,
  tiktok: url,
  youtube: url,
  metaPixelId: pixelId,
  ga4Id: pixelId,
  tiktokPixelId: pixelId,
  maintenance: z.boolean(),
  modules: z.record(z.string(), z.boolean()),
  prizeTh: z.string().trim().max(300),
  prizeEn: z.string().trim().max(300),
  maxSignupsPerIp24h: z.coerce.number().int().min(0).max(1000),
});

export async function saveSettings(formData: FormData) {
  const user = await requireAdmin("ADMIN");
  const s = (k: string) => String(formData.get(k) ?? "");

  const moduleKeys = Object.keys(SETTING_DEFAULTS["modules.enabled"]);
  const parsed = schema.parse({
    cbtAt: s("cbtAt"),
    obtAt: s("obtAt"),
    discord: s("discord").trim(),
    facebook: s("facebook").trim(),
    tiktok: s("tiktok").trim(),
    youtube: s("youtube").trim(),
    metaPixelId: s("metaPixelId"),
    ga4Id: s("ga4Id"),
    tiktokPixelId: s("tiktokPixelId"),
    maintenance: formData.get("maintenance") === "on",
    modules: Object.fromEntries(moduleKeys.map((k) => [k, formData.get(`module.${k}`) === "on"])),
    prizeTh: s("prizeTh"),
    prizeEn: s("prizeEn"),
    maxSignupsPerIp24h: s("maxSignupsPerIp24h"),
  });

  const values: Partial<Record<SettingKey, unknown>> = {
    "site.launch": { cbtAt: parsed.cbtAt, obtAt: parsed.obtAt },
    "site.links": { discord: parsed.discord, facebook: parsed.facebook, tiktok: parsed.tiktok, youtube: parsed.youtube },
    tracking: { metaPixelId: parsed.metaPixelId, ga4Id: parsed.ga4Id, tiktokPixelId: parsed.tiktokPixelId },
    "site.maintenance": parsed.maintenance,
    "modules.enabled": parsed.modules,
    leaderboard: { prizeTh: parsed.prizeTh, prizeEn: parsed.prizeEn },
    fraud: { maxSignupsPerIp24h: parsed.maxSignupsPerIp24h },
  };

  const beforeRows = await prisma.setting.findMany({ where: { key: { in: Object.keys(values) } } });
  const before = Object.fromEntries(beforeRows.map((r) => [r.key, r.value]));

  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: value as Prisma.InputJsonValue },
        create: { key, value: value as Prisma.InputJsonValue },
      }),
    ),
  );
  await audit({ adminId: user.id, op: "UPDATE", action: "settings.update", entity: "settings", before, after: values });

  revalidatePath("/", "layout");
  redirect("/admin/settings?ok=1");
}
