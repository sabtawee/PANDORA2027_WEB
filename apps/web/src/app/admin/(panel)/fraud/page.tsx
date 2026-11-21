import Link from "next/link";
import { prisma } from "@/core/db/prisma";
import { requireAdmin } from "@/core/admin/session";
import { Badge, Card, Flash, fmtDate, PageTitle } from "../ui";
import { reviewReferral } from "./actions";

export default async function FraudPage({ searchParams }: PageProps<"/admin/fraud">) {
  await requireAdmin("ADMIN");
  const { ok } = await searchParams;

  const pending = await prisma.referral.findMany({
    where: { flagged: true, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      inviter: { select: { id: true, name: true, email: true, signupIp: true, signupFingerprint: true, status: true } },
      invitee: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          signupIp: true,
          signupFingerprint: true,
          quests: { where: { status: "COMPLETED", quest: { key: "discord-join" } }, select: { id: true } },
        },
      },
    },
  });

  // How many accounts share each flagged IP — 2 is often a household, 10 is a farm (or a net café).
  const ips = [...new Set(pending.map((r) => r.invitee.signupIp).filter((ip): ip is string => !!ip))];
  const ipCounts = ips.length
    ? await prisma.user.groupBy({ by: ["signupIp"], where: { signupIp: { in: ips } }, _count: { _all: true } })
    : [];
  const ipCount = new Map(ipCounts.map((r) => [r.signupIp, r._count._all]));

  const fps = [...new Set(pending.map((r) => r.invitee.signupFingerprint).filter((fp): fp is string => !!fp))];
  const fpCounts = fps.length
    ? await prisma.user.groupBy({ by: ["signupFingerprint"], where: { signupFingerprint: { in: fps } }, _count: { _all: true } })
    : [];
  const fpCount = new Map(fpCounts.map((r) => [r.signupFingerprint, r._count._all]));

  return (
    <>
      <PageTitle sub="เพื่อนที่สมัครจาก IP หรือเครื่องเดียวกับผู้ชวน ระบบยังไม่จ่ายแต้มจนกว่าจะอนุมัติ · IP เดียวกันอาจเป็นร้านเน็ตหรือคนในบ้าน · เครื่องเดียวกันน่าสงสัยกว่ามาก">
        Fraud Review
      </PageTitle>
      <Flash ok={ok} />

      <Card title={`รอตรวจ ${pending.length} รายการ`}>
        {pending.length === 0 ? (
          <p className="py-6 text-center text-sm text-faint">ไม่มีรายการรอตรวจ ✓</p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((r) => {
              const sameIp = !!r.invitee.signupIp && r.invitee.signupIp === r.inviter.signupIp;
              const sameDevice = !!r.invitee.signupFingerprint && r.invitee.signupFingerprint === r.inviter.signupFingerprint;
              const count = r.invitee.signupIp ? (ipCount.get(r.invitee.signupIp) ?? 0) : 0;
              const devices = r.invitee.signupFingerprint ? (fpCount.get(r.invitee.signupFingerprint) ?? 0) : 0;
              return (
                <li key={r.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 text-sm">
                    <p>
                      <Link href={`/admin/users/${r.inviter.id}`} className="text-gold-bright hover:underline">
                        {r.inviter.name || r.inviter.email}
                      </Link>
                      <span className="text-faint"> ชวน </span>
                      <Link href={`/admin/users/${r.invitee.id}`} className="text-gold-bright hover:underline">
                        {r.invitee.name || r.invitee.email}
                      </Link>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {sameDevice && <Badge tone="danger">เครื่องเดียวกัน</Badge>}
                      {sameIp && <Badge tone="gold">IP เดียวกัน</Badge>}
                      {r.invitee.signupIp && (
                        <Link href={`/admin/users?q=${encodeURIComponent(r.invitee.signupIp)}`} className="hover:underline">
                          IP {r.invitee.signupIp} ({count} บัญชี)
                        </Link>
                      )}
                      {devices > 1 && (
                        <Link href={`/admin/users?q=${r.invitee.signupFingerprint}`} className="text-ember hover:underline">
                          {devices} บัญชีบนเครื่องนี้
                        </Link>
                      )}
                      {r.invitee.quests.length > 0 ? <Badge tone="success">เพื่อนเข้า Discord แล้ว</Badge> : <Badge>ยังไม่เข้า Discord</Badge>}
                      {r.inviter.status === "BANNED" && <Badge tone="danger">ผู้ชวนถูกแบน</Badge>}
                      <span>{fmtDate(r.invitee.createdAt)}</span>
                    </p>
                  </div>
                  <form action={reviewReferral} className="flex shrink-0 gap-2">
                    <input type="hidden" name="referralId" value={r.id} />
                    <button name="decision" value="approve" className="btn-gold px-4 py-1.5 text-sm">
                      อนุมัติ
                    </button>
                    <button name="decision" value="reject" className="rounded-md border border-ember/60 px-4 py-1.5 text-sm text-ember hover:bg-ember/10">
                      ปฏิเสธ
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
