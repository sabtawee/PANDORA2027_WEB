import { requireAdmin } from "@/core/admin/session";
import { getAdminStats } from "@/modules/admin/stats";
import { Card, PageTitle } from "./ui";

export default async function AdminHome() {
  await requireAdmin("ADMIN");
  const s = await getAdminStats();

  const tiles = [
    { label: "สมาชิกทั้งหมด", value: s.total },
    { label: "สมัครวันนี้", value: s.today },
    { label: "เข้า Discord แล้ว", value: s.discordJoined },
    { label: "แต้มที่แจกไป", value: s.pointsIssued },
  ];

  return (
    <>
      <PageTitle sub="ตัวเลขช่วงลงทะเบียนล่วงหน้า (เวลาไทย)">ภาพรวม</PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="panel p-4">
            <p className="text-xs text-muted">{t.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{t.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="สมัครรายวัน (14 วันล่าสุด)">
          {s.daily.length === 0 ? (
            <p className="text-sm text-faint">ยังไม่มีข้อมูล</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-faint">
                <tr>
                  <th className="pb-2 font-normal">วันที่</th>
                  <th className="pb-2 text-right font-normal">คน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {s.daily.map((d) => (
                  <tr key={d.date}>
                    <td className="py-1.5">{d.date}</td>
                    <td className="py-1.5 text-right tabular-nums">{d.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="ที่มาของคนสมัคร (UTM)">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-faint">
              <tr>
                <th className="pb-2 font-normal">source</th>
                <th className="pb-2 font-normal">campaign</th>
                <th className="pb-2 text-right font-normal">คน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {s.sources.map((r, i) => (
                <tr key={i}>
                  <td className="py-1.5">{r.source ?? "—"}</td>
                  <td className="py-1.5 text-muted">{r.campaign ?? "—"}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.count.toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td className="py-1.5 text-faint" colSpan={2}>
                  ไม่มี UTM (organic / direct)
                </td>
                <td className="py-1.5 text-right tabular-nums text-faint">{s.unattributed.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card title="ชวนเพื่อน">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["สำเร็จ", s.referrals.qualified],
              ["รอยืนยัน", s.referrals.pending],
              ["IP ซ้ำ (รอตรวจ)", s.referrals.flagged],
              ["ปฏิเสธ", s.referrals.rejected],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="text-xl font-semibold tabular-nums">{(value as number).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
