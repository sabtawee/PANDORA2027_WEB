import Link from "next/link";
import { notFound } from "next/navigation";
import { pickLocale } from "@/core/i18n/localized";
import { requireAdmin } from "@/core/admin/session";
import { getUserDetail } from "@/modules/admin/users";
import { Badge, Card, Field, Flash, fmtDate, inputCls, PageTitle, SaveButton } from "../../ui";
import { adjustPoints, setUserStatus } from "../actions";

const REF_TONE = { PENDING: "default", QUALIFIED: "success", REJECTED: "danger" } as const;

export default async function UserDetailPage({ params, searchParams }: PageProps<"/admin/users/[id]">) {
  await requireAdmin("ADMIN");
  const [{ id }, { ok }] = await Promise.all([params, searchParams]);
  const detail = await getUserDetail(id);
  if (!detail) notFound();
  const { user, ledger, balance, sameIp, sameDevice } = detail;
  const banned = user.status === "BANNED";

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/users" className="text-faint hover:text-text">← ผู้เล่นทั้งหมด</Link>
      </p>
      <PageTitle sub={user.email}>
        <span className="flex flex-wrap items-center gap-2">
          {user.name || "(ไม่มีชื่อ)"}
          {banned && <Badge tone="danger">แบน</Badge>}
          
        </span>
      </PageTitle>
      <Flash ok={ok} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="ข้อมูล">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Info label="แต้มคงเหลือ" value={<span className="text-lg font-semibold text-gold-bright tabular-nums">{balance.toLocaleString()}</span>} />
              <Info label="รหัสชวนเพื่อน" value={<code>{user.referralCode}</code>} />
              <Info label="สมัครเมื่อ" value={fmtDate(user.createdAt)} />
              <Info label="ล็อกอินด้วย" value={user.accounts.map((a) => a.provider).join(", ") || "-"} />
              <Info
                label="IP ตอนสมัคร"
                value={
                  user.signupIp ? (
                    <>
                      {user.signupIp}{" "}
                      {sameIp > 0 && (
                        <Link href={`/admin/users?q=${encodeURIComponent(user.signupIp)}`} className="text-xs text-ember hover:underline">
                          (มีอีก {sameIp} บัญชี)
                        </Link>
                      )}
                    </>
                  ) : (
                    "-"
                  )
                }
              />
              <Info
                label="เครื่องที่ใช้สมัคร"
                value={
                  user.signupFingerprint ? (
                    sameDevice > 0 ? (
                      <Link href={`/admin/users?q=${user.signupFingerprint}`} className="text-ember hover:underline">
                        มีอีก {sameDevice} บัญชีบนเครื่องนี้
                      </Link>
                    ) : (
                      "ไม่ซ้ำกับใคร"
                    )
                  ) : (
                    "-"
                  )
                }
              />
              <Info
                label="ถูกชวนโดย"
                value={
                  user.invitedBy ? (
                    <Link href={`/admin/users/${user.invitedBy.inviter.id}`} className="text-gold-bright hover:underline">
                      {user.invitedBy.inviter.name || user.invitedBy.inviter.email}
                    </Link>
                  ) : (
                    "-"
                  )
                }
              />
              <Info
                label="ที่มา (UTM)"
                value={
                  user.attribution
                    ? [user.attribution.utmSource, user.attribution.utmMedium, user.attribution.utmCampaign].filter(Boolean).join(" / ") || "direct"
                    : "-"
                }
              />
              <Info
                label="ภารกิจที่ทำแล้ว"
                value={user.quests.filter((q) => q.status === "COMPLETED").map((q) => pickLocale(q.quest.title, "th")).join(", ") || "-"}
              />
            </dl>
          </Card>

          <Card title="ประวัติแต้ม (100 รายการล่าสุด)">
            {ledger.length === 0 ? (
              <p className="text-sm text-faint">ยังไม่มี</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-faint">
                    <tr>
                      <th className="pb-2 font-normal">เมื่อ</th>
                      <th className="pb-2 font-normal">ประเภท</th>
                      <th className="pb-2 font-normal">หมายเหตุ</th>
                      <th className="pb-2 text-right font-normal">แต้ม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {ledger.map((l) => (
                      <tr key={l.id}>
                        <td className="py-1.5 text-xs whitespace-nowrap text-muted">{fmtDate(l.createdAt)}</td>
                        <td className="py-1.5"><code className="text-xs">{l.reason}</code></td>
                        <td className="py-1.5 text-xs text-muted">{l.note}</td>
                        <td className={`py-1.5 text-right tabular-nums ${l.amount < 0 ? "text-ember" : "text-success"}`}>
                          {l.amount > 0 ? "+" : ""}
                          {l.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title={`เพื่อนที่ชวน (${user.invites.length})`}>
            {user.invites.length === 0 ? (
              <p className="text-sm text-faint">ยังไม่มี</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {user.invites.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link href={`/admin/users/${r.invitee.id}`} className="hover:underline">
                      {r.invitee.name || r.invitee.email}
                    </Link>
                    <span className="flex items-center gap-2">
                      {r.flagged && <Badge tone="danger">IP ซ้ำ</Badge>}
                      <Badge tone={REF_TONE[r.status]}>{r.status}</Badge>
                      <span className="text-xs text-faint">{fmtDate(r.createdAt, false)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="ปรับแต้ม">
            <form action={adjustPoints} className="space-y-3">
              <input type="hidden" name="userId" value={user.id} />
              <Field label="จำนวน" hint="ใส่ติดลบเพื่อหักแต้ม เช่น -50">
                <input type="number" name="amount" required className={inputCls} />
              </Field>
              <Field label="เหตุผล (บังคับ)" hint="บันทึกไว้ให้ทีมงานดู ผู้เล่นไม่เห็นข้อความนี้">
                <input name="reason" required minLength={3} maxLength={200} className={inputCls} />
              </Field>
              <SaveButton>ปรับแต้ม</SaveButton>
            </form>
          </Card>

          <Card title={banned ? "ปลดแบน" : "แบนผู้เล่น"}>
              <form action={setUserStatus} className="space-y-3">
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="status" value={banned ? "ACTIVE" : "BANNED"} />
                {!banned && <p className="text-xs text-faint">ผู้เล่นจะถูกออกจากระบบทันที ล็อกอินไม่ได้ และไม่ได้แต้มจากการชวนเพื่อน</p>}
                <Field label="เหตุผล (บังคับ)">
                  <input name="reason" required minLength={3} maxLength={200} className={inputCls} />
                </Field>
                <button type="submit" className={banned ? "btn-gold px-5 py-2 text-sm" : "rounded-md border border-ember/60 px-5 py-2 text-sm text-ember hover:bg-ember/10"}>
                  {banned ? "ปลดแบน" : "แบน"}
                </button>
              </form>
          </Card>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
