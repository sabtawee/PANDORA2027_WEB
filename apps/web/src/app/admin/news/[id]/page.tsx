import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/core/db/prisma";
import { requireRole } from "@/core/rbac";
import { CATEGORY_LABEL } from "@/modules/news/categories";
import { NEWS_CATEGORIES } from "@/modules/news/service";
import { Card, Field, Flash, inputCls, PageTitle, SaveButton } from "../../ui";
import { deleteNews, saveNews } from "../actions";
import { ConfirmSubmit } from "../../ConfirmSubmit";

type L = { th?: string; en?: string } | null;

/** Date → "2027-02-14T12:00" in Thai time for a datetime-local input. */
function toBkkInput(d: Date | null) {
  if (!d) return "";
  return new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 16);
}

export default async function NewsEditPage({ params, searchParams }: PageProps<"/admin/news/[id]">) {
  await requireRole("EDITOR");
  const [{ id }, { ok, error }] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  const post = isNew ? null : await prisma.newsPost.findUnique({ where: { id } });
  if (!isNew && !post) notFound();

  const title = (post?.title ?? null) as L;
  const excerpt = (post?.excerpt ?? null) as L;
  const content = (post?.content ?? null) as L;
  const seoTitle = (post?.seoTitle ?? null) as L;
  const seoDesc = (post?.seoDesc ?? null) as L;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/news" className="text-faint hover:text-text">← ข่าวทั้งหมด</Link>
      </p>
      <PageTitle sub={post ? `/news/${post.slug}` : undefined}>{isNew ? "เขียนข่าวใหม่" : "แก้ไขข่าว"}</PageTitle>
      <Flash ok={ok} />
      {error === "slug" && (
        <p className="mb-4 rounded-md border border-ember/50 bg-ember/10 px-3 py-2 text-sm text-ember">slug นี้มีข่าวอื่นใช้แล้ว เปลี่ยนใหม่</p>
      )}

      <form action={saveNews} className="space-y-6">
        <input type="hidden" name="id" value={post?.id ?? ""} />

        <Card title="ทั่วไป">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="slug (URL)" hint="อังกฤษตัวเล็ก ตัวเลข และ - เช่น cbt-schedule">
              <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={post?.slug ?? ""} className={inputCls} />
            </Field>
            <Field label="หมวด">
              <select name="category" defaultValue={post?.category ?? "NEWS"} className={inputCls}>
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c].th}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="รูปปก (URL)" hint="แนะนำ 1200×630 · https://… หรือ /news/…">
              <input name="coverImage" defaultValue={post?.coverImage ?? ""} className={inputCls} />
            </Field>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          {(["th", "en"] as const).map((l) => {
            const T = l === "th" ? "Th" : "En";
            return (
              <Card key={l} title={l === "th" ? "ภาษาไทย" : "English (ว่างไว้ = ใช้ภาษาไทย)"}>
                <div className="space-y-4">
                  <Field label="หัวข้อ">
                    <input name={`title${T}`} required={l === "th"} maxLength={200} defaultValue={title?.[l] ?? ""} className={inputCls} />
                  </Field>
                  <Field label="สรุปสั้น" hint="แสดงในหน้ารวมข่าว">
                    <textarea name={`excerpt${T}`} rows={2} maxLength={300} defaultValue={excerpt?.[l] ?? ""} className={inputCls} />
                  </Field>
                  <Field label="เนื้อหา" hint="# หัวข้อ · **ตัวหนา** · *เอียง* · [ลิงก์](https://…) · ![รูป](https://…) · - รายการ · เว้นบรรทัดว่างเพื่อขึ้นย่อหน้าใหม่">
                    <textarea name={`content${T}`} required={l === "th"} rows={16} defaultValue={content?.[l] ?? ""} className={`${inputCls} font-mono`} />
                  </Field>
                  <Field label="SEO title" hint="ว่าง = ใช้หัวข้อ · ไม่เกิน 70 ตัวอักษร">
                    <input name={`seoTitle${T}`} maxLength={70} defaultValue={seoTitle?.[l] ?? ""} className={inputCls} />
                  </Field>
                  <Field label="SEO description" hint="ว่าง = ใช้สรุปสั้น · ไม่เกิน 170 ตัวอักษร">
                    <textarea name={`seoDesc${T}`} rows={2} maxLength={170} defaultValue={seoDesc?.[l] ?? ""} className={inputCls} />
                  </Field>
                </div>
              </Card>
            );
          })}
        </div>

        <Card title="เผยแพร่">
          <div className="flex flex-wrap items-end gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPublished" defaultChecked={post?.isPublished ?? false} className="accent-[var(--gold)]" />
              เผยแพร่
            </label>
            <Field label="เวลาเผยแพร่ (เวลาไทย)" hint="ว่าง = ทันที · ใส่เวลาในอนาคต = ตั้งเวลา">
              <input type="datetime-local" name="publishedAt" defaultValue={toBkkInput(post?.publishedAt ?? null)} className={inputCls} />
            </Field>
            <div className="ml-auto">
              <SaveButton />
            </div>
          </div>
        </Card>
      </form>

      {post && (
        <form action={deleteNews} className="mt-6 text-right">
          <input type="hidden" name="id" value={post.id} />
          <ConfirmSubmit message="ลบข่าวนี้ถาวร? กู้คืนไม่ได้" className="text-sm text-ember hover:underline">
            ลบข่าวนี้
          </ConfirmSubmit>
        </form>
      )}
    </>
  );
}
