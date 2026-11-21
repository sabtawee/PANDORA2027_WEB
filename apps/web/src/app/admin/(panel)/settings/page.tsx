import { requireAdmin } from "@/core/admin/session";
import { getSetting, SETTING_DEFAULTS } from "@/core/settings";
import { Card, Field, Flash, inputCls, PageTitle, SaveButton } from "../ui";
import { saveSettings } from "./actions";

/** ISO → "YYYY-MM-DDTHH:mm" in Thai time, for <input type="datetime-local">. */
function toBkkInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(Date.parse(iso) + 7 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

const MODULE_LABELS: Record<string, string> = {
  preregister: "ลงทะเบียนล่วงหน้า",
  quests: "ภารกิจ",
  referral: "ชวนเพื่อน",
  rewards: "รับของรางวัล",
  news: "ข่าวสาร",
  gameAccount: "สร้าง ID เกม",
  ranking: "Ranking",
};

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  await requireAdmin("ADMIN");
  const [{ ok }, launch, links, tracking, maintenance, modules, leaderboard, fraud] = await Promise.all([
    searchParams,
    getSetting("site.launch"),
    getSetting("site.links"),
    getSetting("tracking"),
    getSetting("site.maintenance"),
    getSetting("modules.enabled"),
    getSetting("leaderboard"),
    getSetting("fraud"),
  ]);
  const mods = { ...SETTING_DEFAULTS["modules.enabled"], ...modules };

  return (
    <>
      <PageTitle sub="ค่าที่บันทึกแล้วมีผลกับหน้าเว็บภายใน 1 นาที">ตั้งค่าเว็บ</PageTitle>
      <Flash ok={ok} />

      <form action={saveSettings} className="space-y-6">
        <Card title="วันเปิดเซิร์ฟ (เวลาไทย)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CBT" hint="เว้นว่างได้">
              <input type="datetime-local" name="cbtAt" defaultValue={toBkkInput(launch.cbtAt)} className={inputCls} />
            </Field>
            <Field label="OBT" hint="ใช้กับ countdown หน้าแรก — ว่าง = “ประกาศเร็วๆ นี้”">
              <input type="datetime-local" name="obtAt" defaultValue={toBkkInput(launch.obtAt)} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card title="ลิงก์ Social">
          <div className="grid gap-4 sm:grid-cols-2">
            {(["discord", "facebook", "tiktok", "youtube"] as const).map((k) => (
              <Field key={k} label={k} hint={k === "discord" ? "ลิงก์เชิญเข้าเซิร์ฟ (discord.gg/…)" : undefined}>
                <input type="url" name={k} defaultValue={links[k]} placeholder="https://" className={inputCls} />
              </Field>
            ))}
          </div>
        </Card>

        <Card title="Tracking / Pixel">
          <p className="mb-4 text-xs text-faint">
            โหลดเฉพาะเมื่อผู้ใช้กดยอมรับคุกกี้ · Meta CAPI ฝั่ง server ต้องใส่ <code>META_CAPI_TOKEN</code> ใน .env ด้วย
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Meta Pixel ID">
              <input name="metaPixelId" defaultValue={tracking.metaPixelId} className={inputCls} />
            </Field>
            <Field label="GA4 Measurement ID">
              <input name="ga4Id" defaultValue={tracking.ga4Id} placeholder="G-XXXXXXX" className={inputCls} />
            </Field>
            <Field label="TikTok Pixel ID">
              <input name="tiktokPixelId" defaultValue={tracking.tiktokPixelId} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card title="ของรางวัล Leaderboard">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ข้อความรางวัล (ไทย)" hint="แสดงบนหน้าอันดับ — ว่าง = ไม่แสดง">
              <input name="prizeTh" defaultValue={leaderboard.prizeTh} className={inputCls} />
            </Field>
            <Field label="ข้อความรางวัล (English)">
              <input name="prizeEn" defaultValue={leaderboard.prizeEn} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card title="กันโกง">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="สมัครใหม่ได้สูงสุดต่อ IP ใน 24 ชม." hint="0 = ไม่จำกัด · ร้านเน็ตใช้ IP เดียวกันหลายเครื่อง อย่าตั้งต่ำเกินไป">
              <input type="number" name="maxSignupsPerIp24h" min={0} max={1000} defaultValue={fraud.maxSignupsPerIp24h} className={inputCls} />
            </Field>
          </div>
          <p className="mt-3 text-xs text-faint">
            Turnstile (กันบอท) {process.env.TURNSTILE_SECRET_KEY ? "เปิดอยู่" : "ยังไม่ได้ตั้งค่า — ใส่ TURNSTILE_SECRET_KEY และ NEXT_PUBLIC_TURNSTILE_SITE_KEY ใน .env"}
          </p>
        </Card>

        <Card title="Module / สถานะ">
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(mods).map(([k, on]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={`module.${k}`} defaultChecked={on} className="accent-[var(--gold)]" />
                {MODULE_LABELS[k] ?? k}
              </label>
            ))}
          </div>
          <label className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-sm text-ember">
            <input type="checkbox" name="maintenance" defaultChecked={maintenance} className="accent-[var(--ember)]" />
            โหมดปิดปรับปรุง
          </label>
        </Card>

        <SaveButton />
      </form>
    </>
  );
}
