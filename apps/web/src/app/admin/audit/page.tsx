import Link from "next/link";
import { prisma } from "@/core/db/prisma";
import { requireRole } from "@/core/rbac";
import type { Prisma } from "@/generated/prisma/client";
import { Card, fmtDate, inputCls, PageTitle, Pager } from "../ui";

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const action = typeof sp.action === "string" ? sp.action.trim() : "";
  const target = typeof sp.target === "string" ? sp.target.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action: { startsWith: action } } : {}),
    ...(target ? { target } : {}),
  };
  const [total, rows, actions] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.groupBy({ by: ["action"], orderBy: { action: "asc" } }),
  ]);

  return (
    <>
      <PageTitle sub="ทุกการแก้ไขในหลังบ้าน ใครแก้ เมื่อไร แก้อะไร">Audit Log</PageTitle>

      <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <select name="action" defaultValue={action} className={inputCls}>
          <option value="">ทุกการกระทำ</option>
          {actions.map((a) => (
            <option key={a.action} value={a.action}>
              {a.action}
            </option>
          ))}
        </select>
        <input name="target" defaultValue={target} placeholder="target (เช่น user id)" className={inputCls} />
        <button className="btn-gold shrink-0 px-5 py-2 text-sm">กรอง</button>
      </form>

      <Card title={`${total.toLocaleString()} รายการ`}>
        <ul className="divide-y divide-line text-sm">
          {rows.map((r) => (
            <li key={r.id} className="py-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs whitespace-nowrap text-faint">{fmtDate(r.createdAt)}</span>
                <code className="text-xs text-gold-bright">{r.action}</code>
                {r.target && (
                  <Link href={`?target=${encodeURIComponent(r.target)}`} className="truncate text-xs text-muted hover:underline">
                    {r.target}
                  </Link>
                )}
                <span className="ml-auto text-xs text-muted">
                  {r.actor ? (
                    <Link href={`/admin/users/${r.actor.id}`} className="hover:underline">
                      {r.actor.email ?? r.actor.name}
                    </Link>
                  ) : (
                    "system"
                  )}
                  {r.ip && <span className="text-faint"> · {r.ip}</span>}
                </span>
              </div>
              {r.data != null && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs text-faint">รายละเอียด</summary>
                  <pre className="mt-1 overflow-x-auto rounded bg-bg-sunken p-2 text-xs text-muted">{JSON.stringify(r.data, null, 2)}</pre>
                </details>
              )}
            </li>
          ))}
        </ul>
        {rows.length === 0 && <p className="py-6 text-center text-sm text-faint">ไม่มีรายการ</p>}
        <Pager page={page} pages={Math.max(1, Math.ceil(total / PAGE_SIZE))} params={{ action, target }} />
      </Card>
    </>
  );
}
