import Link from "next/link";
import { requireAdmin } from "@/core/admin/session";
import { prisma } from "@/core/db/prisma";
import type { AdminLoginEvent, Prisma } from "@/generated/prisma/client";
import { Badge, Card, fmtDate, inputCls, PageTitle, Pager } from "../ui";

const PAGE_SIZE = 50;
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

const EVENT: Record<AdminLoginEvent, { label: string; tone: "success" | "danger" | "default" }> = {
  LOGIN_SUCCESS: { label: "เข้าระบบ", tone: "success" },
  LOGIN_FAILED: { label: "ไม่สำเร็จ", tone: "danger" },
  LOGOUT: { label: "ออกจากระบบ", tone: "default" },
};

const REASON: Record<string, string> = {
  OK: "",
  BAD_PASSWORD: "รหัสผ่านผิด",
  BAD_PASSWORD_LOCKED: "รหัสผ่านผิด → ล็อกบัญชี 15 นาที",
  UNKNOWN_USER: "ไม่มีชื่อผู้ใช้นี้",
  LOCKED: "บัญชีถูกล็อกอยู่",
  DISABLED: "บัญชีถูกปิดใช้งาน",
  RATE_LIMIT: "ลองบ่อยเกินไป",
  CAPTCHA: "ไม่ผ่านการตรวจบอท",
  LOGOUT: "",
};

export default async function LoginsPage({ searchParams }: PageProps<"/admin/logins">) {
  await requireAdmin("ADMIN");
  const sp = await searchParams;
  const username = typeof sp.username === "string" ? sp.username.trim().toLowerCase() : "";
  const ip = typeof sp.ip === "string" ? sp.ip.trim() : "";
  const event = typeof sp.event === "string" && sp.event in EVENT ? (sp.event as AdminLoginEvent) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.AdminLoginLogWhereInput = {
    ...(username ? { username } : {}),
    ...(ip ? { ip } : {}),
    ...(event ? { event } : {}),
  };
  const since24h = hoursAgo(24);
  const [total, rows, failed24h] = await Promise.all([
    prisma.adminLoginLog.count({ where }),
    prisma.adminLoginLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.adminLoginLog.count({ where: { event: "LOGIN_FAILED", createdAt: { gte: since24h } } }),
  ]);

  return (
    <>
      <PageTitle sub="ทุกครั้งที่มีคนพยายามเข้าหลังบ้าน ทั้งสำเร็จและไม่สำเร็จ และการออกจากระบบ">ประวัติเข้าระบบ</PageTitle>

      {failed24h > 0 && (
        <p className="mb-4 rounded-md border border-ember/40 bg-ember/5 px-3 py-2 text-sm text-ember">
          เข้าระบบไม่สำเร็จ {failed24h} ครั้งใน 24 ชม. ที่ผ่านมา ·{" "}
          <Link href="?event=LOGIN_FAILED" className="underline">ดูรายการ</Link>
        </p>
      )}

      <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input name="username" defaultValue={username} placeholder="ชื่อผู้ใช้" className={inputCls} />
        <input name="ip" defaultValue={ip} placeholder="IP" className={inputCls} />
        <select name="event" defaultValue={event ?? ""} className={inputCls}>
          <option value="">ทุกเหตุการณ์</option>
          {Object.entries(EVENT).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button className="btn-gold shrink-0 px-5 py-2 text-sm">กรอง</button>
      </form>

      <Card title={`${total.toLocaleString()} รายการ`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-faint">
              <tr>
                <th className="pb-2 font-normal">เมื่อ</th>
                <th className="pb-2 font-normal">ชื่อผู้ใช้</th>
                <th className="pb-2 font-normal">ผล</th>
                <th className="pb-2 font-normal">IP</th>
                <th className="pb-2 font-normal">เบราว์เซอร์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="py-2 text-xs whitespace-nowrap text-muted">{fmtDate(r.createdAt)}</td>
                  <td className="py-2">
                    <Link href={`?username=${encodeURIComponent(r.username)}`} className={r.adminId ? "hover:underline" : "text-faint hover:underline"}>
                      {r.username}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Badge tone={EVENT[r.event].tone}>{EVENT[r.event].label}</Badge>
                    {REASON[r.reason] !== "" && <p className="mt-0.5 text-xs text-faint">{REASON[r.reason] ?? r.reason}</p>}
                  </td>
                  <td className="py-2 text-xs">
                    {r.ip && <Link href={`?ip=${encodeURIComponent(r.ip)}`} className="hover:underline">{r.ip}</Link>}
                  </td>
                  <td className="max-w-xs truncate py-2 text-xs text-faint" title={r.userAgent ?? ""}>{r.userAgent}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-6 text-center text-sm text-faint">ไม่มีรายการ</p>}
        </div>
        <Pager page={page} pages={Math.max(1, Math.ceil(total / PAGE_SIZE))} params={{ username, ip, event: event ?? "" }} />
      </Card>
    </>
  );
}
