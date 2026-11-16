import { prisma } from "@/core/db/prisma";
import { requireRole } from "@/core/rbac";
import { formatItemLines } from "@/modules/rewards/items";
import { TIER_COLORS } from "@/modules/rewards/tiers";
import { Card, Field, Flash, inputCls, PageTitle, SaveButton } from "../ui";
import { deleteTier, saveTier } from "./actions";

type Localized = Record<string, string>;

function TierForm({ t }: { t?: { id: string; key: string; title: Localized; minPoints: number; items: unknown; isActive: boolean } }) {
  return (
    <form action={saveTier} className="space-y-4">
      {t && <input type="hidden" name="id" value={t.id} />}
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="key" hint="bronze / silver / gold / pandora ใช้สีพิเศษ">
          <input name="key" required defaultValue={t?.key} className={inputCls} />
        </Field>
        <Field label="ชื่อ (ไทย)">
          <input name="titleTh" required defaultValue={t?.title.th ?? ""} className={inputCls} />
        </Field>
        <Field label="ชื่อ (English)">
          <input name="titleEn" defaultValue={t?.title.en ?? ""} className={inputCls} />
        </Field>
        <Field label="แต้มสะสมขั้นต่ำ">
          <input type="number" name="minPoints" required min={0} defaultValue={t?.minPoints} className={inputCls} />
        </Field>
      </div>
      <Field label="ไอเทมรางวัล" hint="บรรทัดละ 1 ชิ้น รูปแบบ itemId:จำนวน — ได้ทุก tier ที่ถึง (ไม่ใช่เฉพาะ tier สูงสุด)">
        <textarea name="items" rows={3} defaultValue={formatItemLines(t?.items)} className={`${inputCls} font-mono`} />
      </Field>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={t?.isActive ?? true} className="accent-[var(--gold)]" />
          เปิดใช้งาน
        </label>
        <SaveButton>{t ? "บันทึก" : "เพิ่ม tier"}</SaveButton>
      </div>
    </form>
  );
}

export default async function TiersPage({ searchParams }: PageProps<"/admin/tiers">) {
  await requireRole("ADMIN");
  const [{ ok }, tiers] = await Promise.all([searchParams, prisma.rewardTier.findMany({ orderBy: { minPoints: "asc" } })]);

  return (
    <>
      <PageTitle sub="ระดับคำนวณจากแต้มที่เคยได้ทั้งหมด (ใช้แต้มแล้วระดับไม่ลด)">Reward Tiers</PageTitle>
      <Flash ok={ok} />
      <div className="space-y-6">
        {tiers.map((t) => (
          <Card
            key={t.id}
            title={
              <span className="flex items-center justify-between gap-2">
                <span style={{ color: TIER_COLORS[t.key] ?? "var(--gold)" }}>
                  {(t.title as Localized).th} · {t.minPoints.toLocaleString()} แต้ม
                </span>
                <form action={deleteTier}>
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="text-xs text-ember hover:underline">
                    ลบ
                  </button>
                </form>
              </span>
            }
          >
            <TierForm t={{ id: t.id, key: t.key, title: t.title as Localized, minPoints: t.minPoints, items: t.items, isActive: t.isActive }} />
          </Card>
        ))}
        <Card title="เพิ่ม tier ใหม่">
          <TierForm />
        </Card>
      </div>
    </>
  );
}
