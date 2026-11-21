import Link from "next/link";
import { requireAdmin } from "@/core/admin/session";
import { searchUsers } from "@/modules/admin/users";
import { Badge, Card, fmtDate, inputCls, PageTitle, Pager } from "../ui";

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireAdmin("ADMIN");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { users, total, pages } = await searchUsers(q, page);

  return (
    <>
      <PageTitle sub="ค้นหาด้วยอีเมล ชื่อ รหัสชวนเพื่อน user id, IP หรือ fingerprint เครื่อง">ผู้เล่น</PageTitle>

      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="ค้นหา…" className={inputCls} />
        <button className="btn-gold px-5 py-2 text-sm">ค้นหา</button>
      </form>

      <Card title={`${total.toLocaleString()} คน`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-faint">
              <tr>
                <th className="pb-2 font-normal">ผู้เล่น</th>
                <th className="pb-2 font-normal">ล็อกอินด้วย</th>
                <th className="pb-2 font-normal">สถานะ</th>
                <th className="pb-2 text-right font-normal">แต้ม</th>
                <th className="pb-2 text-right font-normal">สมัครเมื่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2">
                    <Link href={`/admin/users/${u.id}`} className="text-gold-bright hover:underline">
                      {u.name || "(ไม่มีชื่อ)"}
                    </Link>
                    <p className="text-xs text-faint">{u.email}</p>
                  </td>
                  <td className="py-2 text-xs text-muted">{u.accounts.map((a) => a.provider).join(", ")}</td>
                  <td className="py-2">
                    <span className="flex flex-wrap gap-1">
                      {u.status === "BANNED" && <Badge tone="danger">แบน</Badge>}
                      {u.role !== "USER" && <Badge>{u.role}</Badge>}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums">{u.balance.toLocaleString()}</td>
                  <td className="py-2 text-right text-xs whitespace-nowrap text-muted">{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="py-6 text-center text-sm text-faint">ไม่พบผู้เล่น</p>}
        </div>
        <Pager page={page} pages={pages} params={{ q }} />
      </Card>
    </>
  );
}
