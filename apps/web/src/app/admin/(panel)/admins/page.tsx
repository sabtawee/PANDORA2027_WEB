import Link from "next/link";
import { ROLE_LABEL } from "@/core/admin/roles";
import { requireAdmin } from "@/core/admin/session";
import { prisma } from "@/core/db/prisma";
import { Badge, Card, Flash, fmtDate, inputCls, PageTitle } from "../ui";
import { revokeSessionsAction, unlockAdminAction, updateAdminAction } from "./actions";
import { CreateAdminForm, ResetPasswordForm } from "./TempPasswordForms";

const ERRORS: Record<string, string> = {
  self: "ลดสิทธิ์หรือปิดบัญชีตัวเองไม่ได้",
  last: "ต้องมี Super Admin ที่ใช้งานได้อย่างน้อย 1 คนเสมอ",
};

export default async function AdminsPage({ searchParams }: PageProps<"/admin/admins">) {
  const me = await requireAdmin("SUPER_ADMIN");
  const { ok, error } = await searchParams;
  const now = new Date();
  const admins = await prisma.adminUser.findMany({
    orderBy: [{ isActive: "desc" }, { role: "asc" }, { username: "asc" }],
    include: { _count: { select: { sessions: { where: { expiresAt: { gt: now } } } } } },
  });

  return (
    <>
      <PageTitle sub="บัญชีทีมงานแยกจากบัญชีผู้เล่น ล็อกอินด้วยชื่อผู้ใช้ + รหัสผ่าน · ทุกการเปลี่ยนแปลงถูกบันทึกใน Audit Log">บัญชีแอดมิน</PageTitle>
      <Flash ok={ok} />
      {typeof error === "string" && ERRORS[error] && (
        <p className="mb-4 rounded-md border border-ember/50 bg-ember/10 px-3 py-2 text-sm text-ember">{ERRORS[error]}</p>
      )}

      <div className="space-y-6">
        <Card title="เพิ่มแอดมิน">
          <CreateAdminForm />
        </Card>

        {admins.map((a) => {
          const locked = !!a.lockedUntil && a.lockedUntil > now;
          const self = a.id === me.id;
          return (
            <Card
              key={a.id}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {a.displayName}
                  <code className="text-xs text-faint">@{a.username}</code>
                  {self && <Badge tone="gold">คุณ</Badge>}
                  {!a.isActive && <Badge tone="danger">ปิดใช้งาน</Badge>}
                  {locked && <Badge tone="danger">ล็อกถึง {fmtDate(a.lockedUntil)}</Badge>}
                  {a.mustChangePassword && <Badge>รอเปลี่ยนรหัสผ่าน</Badge>}
                </span>
              }
            >
              <p className="-mt-2 mb-4 text-xs text-faint">
                เข้าระบบล่าสุด {fmtDate(a.lastLoginAt)} {a.lastLoginIp && `จาก ${a.lastLoginIp}`} · ล็อกอินค้างอยู่ {a._count.sessions} เครื่อง ·{" "}
                <Link href={`/admin/logins?username=${encodeURIComponent(a.username)}`} className="underline">ประวัติเข้าระบบ</Link> ·{" "}
                <Link href={`/admin/audit?admin=${a.id}`} className="underline">สิ่งที่แก้ไข</Link>
              </p>

              <form action={updateAdminAction} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                <input type="hidden" name="id" value={a.id} />
                <label className="block">
                  <span className="text-xs text-muted">ชื่อที่แสดง</span>
                  <input name="displayName" required defaultValue={a.displayName} className={`${inputCls} mt-1`} />
                </label>
                <label className="block">
                  <span className="text-xs text-muted">สิทธิ์</span>
                  <select name="role" defaultValue={a.role} disabled={self} className={`${inputCls} mt-1`}>
                    {Object.entries(ROLE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  {self && <input type="hidden" name="role" value={a.role} />}
                </label>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={a.isActive} disabled={self} className="accent-[var(--gold)]" />
                  ใช้งาน
                  {self && <input type="hidden" name="isActive" value="on" />}
                </label>
                <button type="submit" className="btn-gold px-4 py-2 text-sm">บันทึก</button>
              </form>

              <div className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-2 border-t border-line pt-3">
                <ResetPasswordForm id={a.id} username={a.username} />
                {locked && (
                  <form action={unlockAdminAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-gold-bright hover:underline">ปลดล็อก</button>
                  </form>
                )}
                {a._count.sessions > 0 && (
                  <form action={revokeSessionsAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-ember hover:underline">{self ? "ออกจากระบบเครื่องอื่นทั้งหมด" : "บังคับออกจากระบบทุกเครื่อง"}</button>
                  </form>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
