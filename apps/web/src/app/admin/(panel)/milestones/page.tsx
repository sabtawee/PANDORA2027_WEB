import { prisma } from "@/core/db/prisma";
import { requireAdmin } from "@/core/admin/session";
import { Card, Field, Flash, inputCls, PageTitle, SaveButton } from "../ui";
import { ImageField } from "@/core/ui/ImageField";
import { deleteMilestone, saveMilestone } from "./actions";

type Localized = Record<string, string>;
type Item = { itemId: number; amount: number };

interface MilestoneFormProps {
  m?: {
    id: string;
    target: number;
    title: Localized;
    description: Localized;
    items: Item[];
    sortOrder: number;
    isActive: boolean;
    image: string | null;
  };
}

function MilestoneForm({ m }: MilestoneFormProps) {
  return (
    <form action={saveMilestone} className="space-y-4">
      {m && <input type="hidden" name="id" value={m.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="เป้าจำนวนคนสมัคร">
          <input type="number" name="target" required min={1} defaultValue={m?.target} className={inputCls} />
        </Field>
        <Field label="ชื่อ (ไทย)">
          <input name="titleTh" required defaultValue={m?.title.th ?? ""} className={inputCls} />
        </Field>
        <Field label="ชื่อ (English)">
          <input name="titleEn" defaultValue={m?.title.en ?? ""} className={inputCls} />
        </Field>
        <Field label="คำอธิบาย (ไทย)">
          <input name="descTh" defaultValue={m?.description.th ?? ""} className={inputCls} />
        </Field>
        <Field label="คำอธิบาย (English)">
          <input name="descEn" defaultValue={m?.description.en ?? ""} className={inputCls} />
        </Field>
        <Field label="ลำดับ">
          <input type="number" name="sortOrder" min={0} defaultValue={m?.sortOrder ?? 0} className={inputCls} />
        </Field>
      </div>
      <ImageField current={m?.image} label="รูปของรางวัล (แสดงบน timeline หน้าแรก)" />
      <Field label="ไอเทมรางวัล" hint="บรรทัดละ 1 ชิ้น รูปแบบ itemId:จำนวน เช่น 501:10 (ไอเทม ID จาก item_db ของ rAthena)">
        <textarea
          name="items"
          rows={3}
          defaultValue={m?.items.map((i) => `${i.itemId}:${i.amount}`).join("\n")}
          className={`${inputCls} font-mono`}
        />
      </Field>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={m?.isActive ?? true} className="accent-[var(--gold)]" />
          เปิดใช้งาน
        </label>
        <SaveButton>{m ? "บันทึก" : "เพิ่ม milestone"}</SaveButton>
      </div>
    </form>
  );
}

export default async function MilestonesPage({ searchParams }: PageProps<"/admin/milestones">) {
  await requireAdmin("ADMIN");
  const [{ ok, error }, milestones, registered] = await Promise.all([
    searchParams,
    prisma.milestone.findMany({ orderBy: { target: "asc" } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <>
      <PageTitle sub={`ตอนนี้มีคนสมัคร ${registered.toLocaleString()} คน · ครบเป้าแล้วโซ่จะแตกบนหน้าแรกอัตโนมัติ`}>
        Milestones (โซ่แพนโดร่า)
      </PageTitle>
      <Flash ok={ok} />
      {typeof error === "string" && error && (
        <p className="mb-4 rounded-md border border-ember/50 bg-ember/10 px-3 py-2 text-sm text-ember">อัปโหลดรูปไม่สำเร็จ: {error}</p>
      )}

      <div className="space-y-6">
        {milestones.map((m) => (
          <Card
            key={m.id}
            title={
              <span className="flex items-center justify-between gap-2">
                <span>
                  {m.target.toLocaleString()} คน
                  {registered >= m.target && <span className="ml-2 text-xs text-success">ปลดล็อกแล้ว</span>}
                </span>
                <form action={deleteMilestone}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-xs text-ember hover:underline">
                    ลบ
                  </button>
                </form>
              </span>
            }
          >
            <MilestoneForm
              m={{
                id: m.id,
                target: m.target,
                title: m.title as Localized,
                description: (m.description ?? {}) as Localized,
                items: (m.items ?? []) as Item[],
                sortOrder: m.sortOrder,
                isActive: m.isActive,
                image: m.image,
              }}
            />
          </Card>
        ))}

        <Card title="เพิ่ม milestone ใหม่">
          <MilestoneForm />
        </Card>
      </div>
    </>
  );
}
