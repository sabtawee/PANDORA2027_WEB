import { prisma } from "@/core/db/prisma";
import { pickLocale } from "@/core/i18n/localized";
import { requireAdmin } from "@/core/admin/session";
import { Card, Field, Flash, inputCls, PageTitle, SaveButton } from "../ui";
import { saveQuest } from "./actions";

const TYPE_NOTE: Record<string, string> = {
  SIGNUP: "ให้แต้มทันทีเมื่อสมัคร",
  DISCORD_JOIN: "ให้แต้มเมื่อผูก Discord และอยู่ในเซิร์ฟ Discord",
  REFERRAL: "แต้มที่ผู้ชวนได้ ต่อเพื่อน 1 คนที่เข้า Discord · จำนวนครั้ง 0 = ไม่จำกัด",
};

export default async function QuestsPage({ searchParams }: PageProps<"/admin/quests">) {
  await requireAdmin("ADMIN");
  const [{ ok }, quests] = await Promise.all([searchParams, prisma.quest.findMany({ orderBy: { sortOrder: "asc" } })]);

  return (
    <>
      <PageTitle sub="แก้แต้มมีผลกับการได้แต้มครั้งถัดไป ไม่ย้อนหลัง">ภารกิจ / แต้ม</PageTitle>
      <Flash ok={ok} />

      <div className="space-y-6">
        {quests.map((q) => {
          const title = q.title as Record<string, string>;
          const desc = (q.description ?? {}) as Record<string, string>;
          return (
            <Card
              key={q.id}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {pickLocale(q.title, "th")}
                  <code className="rounded bg-bg-sunken px-1.5 py-0.5 text-xs text-faint">{q.type}</code>
                </span>
              }
            >
              {TYPE_NOTE[q.type] && <p className="-mt-2 mb-4 text-xs text-faint">{TYPE_NOTE[q.type]}</p>}
              <form action={saveQuest} className="space-y-4">
                <input type="hidden" name="id" value={q.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="ชื่อ (ไทย)">
                    <input name="titleTh" required defaultValue={title.th ?? ""} className={inputCls} />
                  </Field>
                  <Field label="ชื่อ (English)">
                    <input name="titleEn" defaultValue={title.en ?? ""} className={inputCls} />
                  </Field>
                  <Field label="คำอธิบาย (ไทย)">
                    <input name="descTh" defaultValue={desc.th ?? ""} className={inputCls} />
                  </Field>
                  <Field label="คำอธิบาย (English)">
                    <input name="descEn" defaultValue={desc.en ?? ""} className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="แต้ม">
                    <input type="number" name="points" min={0} defaultValue={q.points} className={inputCls} />
                  </Field>
                  <Field label="จำนวนครั้ง/คน">
                    <input type="number" name="maxPerUser" min={0} defaultValue={q.maxPerUser} className={inputCls} />
                  </Field>
                  <Field label="ลำดับ">
                    <input type="number" name="sortOrder" min={0} defaultValue={q.sortOrder} className={inputCls} />
                  </Field>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={q.isActive} className="accent-[var(--gold)]" />
                    เปิดใช้งาน
                  </label>
                  <SaveButton />
                </div>
              </form>
            </Card>
          );
        })}
      </div>
    </>
  );
}
