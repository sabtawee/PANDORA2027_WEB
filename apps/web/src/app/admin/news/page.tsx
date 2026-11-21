import Link from "next/link";
import { prisma } from "@/core/db/prisma";
import { pickLocale } from "@/core/i18n/localized";
import { requireRole } from "@/core/rbac";
import { getSetting } from "@/core/settings";
import { CATEGORY_LABEL } from "@/modules/news/categories";
import { Badge, Card, Flash, fmtDate, PageTitle } from "../ui";


export default async function NewsAdminPage({ searchParams }: PageProps<"/admin/news">) {
  await requireRole("EDITOR");
  const [{ ok }, posts, modules] = await Promise.all([
    searchParams,
    prisma.newsPost.findMany({
      orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
      select: { id: true, slug: true, title: true, category: true, isPublished: true, publishedAt: true, updatedAt: true },
    }),
    getSetting("modules.enabled"),
  ]);
  const now = new Date();

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle sub="ข่าว / patch note / คู่มือ / กิจกรรม 2 ภาษา">ข่าวสาร</PageTitle>
        <Link href="/admin/news/new" className="btn-gold px-5 py-2 text-sm">
          + เขียนข่าว
        </Link>
      </div>
      <Flash ok={ok} />
      {!modules.news && (
        <p className="mb-4 rounded-md border border-gold/40 bg-gold/5 px-3 py-2 text-sm text-gold-bright">
          หน้าข่าวยังปิดอยู่ ผู้เล่นยังไม่เห็น · เปิดได้ที่ <Link href="/admin/settings" className="underline">ตั้งค่าเว็บ → Modules → news</Link>
        </p>
      )}

      <Card>
        {posts.length === 0 ? (
          <p className="py-6 text-center text-sm text-faint">ยังไม่มีข่าว</p>
        ) : (
          <ul className="divide-y divide-line">
            {posts.map((p) => {
              const scheduled = p.isPublished && p.publishedAt && p.publishedAt > now;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/news/${p.id}`} className="text-gold-bright hover:underline">
                      {pickLocale(p.title, "th")}
                    </Link>
                    <p className="text-xs text-faint">/{p.slug}</p>
                  </div>
                  <Badge>{CATEGORY_LABEL[p.category].th}</Badge>
                  {!p.isPublished ? <Badge>ฉบับร่าง</Badge> : scheduled ? <Badge tone="gold">ตั้งเวลา</Badge> : <Badge tone="success">เผยแพร่แล้ว</Badge>}
                  <span className="w-36 text-right text-xs text-muted">{fmtDate(p.publishedAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
