import Link from "next/link";
import { requireAdmin } from "@/core/admin/session";
import { prisma } from "@/core/db/prisma";
import type { AuditOp, Prisma } from "@/generated/prisma/client";
import { Badge, Card, fmtDate, inputCls, PageTitle, Pager } from "../ui";

const PAGE_SIZE = 50;

const OP: Record<AuditOp, { label: string; tone: "success" | "danger" | "gold" | "default" }> = {
  CREATE: { label: "เพิ่ม", tone: "success" },
  UPDATE: { label: "แก้ไข", tone: "gold" },
  DELETE: { label: "ลบ", tone: "danger" },
  ACTION: { label: "ดำเนินการ", tone: "default" },
  SECURITY: { label: "ความปลอดภัย", tone: "danger" },
};

const IGNORED = new Set(["updatedAt", "createdAt"]);
const show = (v: unknown) => (v === undefined ? "—" : typeof v === "string" ? v : JSON.stringify(v));

/** Top-level fields that differ between before and after (both may be missing). */
function diff(before: unknown, after: unknown) {
  const b = (before && typeof before === "object" ? before : {}) as Record<string, unknown>;
  const a = (after && typeof after === "object" ? after : {}) as Record<string, unknown>;
  return [...new Set([...Object.keys(b), ...Object.keys(a)])]
    .filter((k) => !IGNORED.has(k) && JSON.stringify(b[k]) !== JSON.stringify(a[k]))
    .map((k) => ({ key: k, before: b[k], after: a[k] }));
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireAdmin("ADMIN");
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const action = str("action");
  const target = str("target");
  const adminId = str("admin");
  const op = str("op") in OP ? (str("op") as AuditOp) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action: { startsWith: action } } : {}),
    ...(target ? { target } : {}),
    ...(adminId ? { adminId } : {}),
    ...(op ? { op } : {}),
  };
  const [total, rows, actions, admins] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        admin: { select: { id: true, username: true, displayName: true } },
        actor: { select: { id: true, email: true } },
      },
    }),
    prisma.auditLog.groupBy({ by: ["action"], orderBy: { action: "asc" } }),
    prisma.adminUser.findMany({ select: { id: true, username: true }, orderBy: { username: "asc" } }),
  ]);

  return (
    <>
      <PageTitle sub="ทุกการเพิ่ม ลบ แก้ไขในหลังบ้าน ใครทำ เมื่อไร จากไหน และค่าก่อน → หลัง">Audit Log</PageTitle>

      <form className="mb-4 grid gap-2 sm:grid-cols-5">
        <select name="admin" defaultValue={adminId} className={inputCls}>
          <option value="">แอดมินทุกคน</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>@{a.username}</option>
          ))}
        </select>
        <select name="op" defaultValue={op ?? ""} className={inputCls}>
          <option value="">ทุกประเภท</option>
          {Object.entries(OP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select name="action" defaultValue={action} className={inputCls}>
          <option value="">ทุกการกระทำ</option>
          {actions.map((a) => (
            <option key={a.action} value={a.action}>{a.action}</option>
          ))}
        </select>
        <input name="target" defaultValue={target} placeholder="target (id / key)" className={inputCls} />
        <button className="btn-gold px-5 py-2 text-sm">กรอง</button>
      </form>

      <Card title={`${total.toLocaleString()} รายการ`}>
        <ul className="divide-y divide-line text-sm">
          {rows.map((r) => {
            const changes = r.op === "UPDATE" ? diff(r.before, r.after) : [];
            return (
              <li key={r.id} className="py-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-xs whitespace-nowrap text-faint">{fmtDate(r.createdAt)}</span>
                  <Badge tone={OP[r.op].tone}>{OP[r.op].label}</Badge>
                  <code className="text-xs text-gold-bright">{r.action}</code>
                  {r.target && (
                    <Link href={`?target=${encodeURIComponent(r.target)}`} className="truncate text-xs text-muted hover:underline">
                      {r.target}
                    </Link>
                  )}
                  <span className="ml-auto text-xs text-muted">
                    {r.admin ? (
                      <Link href={`?admin=${r.admin.id}`} className="hover:underline">@{r.admin.username}</Link>
                    ) : r.actor ? (
                      <span title="บัญชีผู้เล่น (ก่อนมีบัญชีแอดมินแยก)">{r.actor.email}</span>
                    ) : (
                      "system"
                    )}
                    {r.ip && <span className="text-faint"> · {r.ip}</span>}
                  </span>
                </div>

                {changes.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {changes.map((c) => (
                      <li key={c.key} className="break-all">
                        <span className="text-faint">{c.key}:</span> <span className="text-ember line-through">{show(c.before)}</span> →{" "}
                        <span className="text-success">{show(c.after)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {(r.before != null || r.after != null || r.data != null || r.userAgent) && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-faint">ข้อมูลทั้งหมด</summary>
                    <div className="mt-1 grid gap-2 lg:grid-cols-2">
                      {r.before != null && (
                        <div>
                          <p className="text-xs text-faint">ก่อน</p>
                          <pre className="overflow-x-auto rounded bg-bg-sunken p-2 text-xs text-muted">{JSON.stringify(r.before, null, 2)}</pre>
                        </div>
                      )}
                      {r.after != null && (
                        <div>
                          <p className="text-xs text-faint">หลัง</p>
                          <pre className="overflow-x-auto rounded bg-bg-sunken p-2 text-xs text-muted">{JSON.stringify(r.after, null, 2)}</pre>
                        </div>
                      )}
                      {r.data != null && (
                        <div>
                          <p className="text-xs text-faint">รายละเอียด</p>
                          <pre className="overflow-x-auto rounded bg-bg-sunken p-2 text-xs text-muted">{JSON.stringify(r.data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                    {r.userAgent && <p className="mt-1 text-xs break-all text-faint">{r.userAgent}</p>}
                  </details>
                )}
              </li>
            );
          })}
        </ul>
        {rows.length === 0 && <p className="py-6 text-center text-sm text-faint">ไม่มีรายการ</p>}
        <Pager page={page} pages={Math.max(1, Math.ceil(total / PAGE_SIZE))} params={{ action, target, admin: adminId, op: op ?? "" }} />
      </Card>
    </>
  );
}
