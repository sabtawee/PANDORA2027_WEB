import "server-only";
import { prisma } from "@/core/db/prisma";
import { Prisma } from "@/generated/prisma/client";

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Midnight today in Bangkok, as a UTC Date. */
function startOfTodayBangkok() {
  const bkk = new Date(Date.now() + BKK_OFFSET_MS);
  bkk.setUTCHours(0, 0, 0, 0);
  return new Date(bkk.getTime() - BKK_OFFSET_MS);
}

export async function getAdminStats() {
  const today = startOfTodayBangkok();
  const since = new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000);

  const [total, todayCount, daily, sources, referrals, flagged, discordJoined, pointsIssued] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.$queryRaw<{ d: Date; c: bigint }[]>(Prisma.sql`
      SELECT DATE(CONVERT_TZ(createdAt, '+00:00', '+07:00')) AS d, COUNT(*) AS c
      FROM User WHERE createdAt >= ${since}
      GROUP BY d ORDER BY d DESC`),
    prisma.attribution.groupBy({
      by: ["utmSource", "utmCampaign"],
      _count: { _all: true },
      orderBy: { _count: { userId: "desc" } },
      take: 15,
    }),
    prisma.referral.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.referral.count({ where: { flagged: true, status: "PENDING" } }),
    prisma.questProgress.count({ where: { status: "COMPLETED", quest: { key: "discord-join" } } }),
    prisma.pointLedger.aggregate({ _sum: { amount: true } }),
  ]);

  const attributed = sources.reduce((n, s) => n + s._count._all, 0);
  const ref = Object.fromEntries(referrals.map((r) => [r.status, r._count._all]));

  return {
    total,
    today: todayCount,
    discordJoined,
    pointsIssued: pointsIssued._sum.amount ?? 0,
    referrals: { pending: ref.PENDING ?? 0, qualified: ref.QUALIFIED ?? 0, rejected: ref.REJECTED ?? 0, flagged },
    daily: daily.map((r) => ({ date: new Date(r.d).toISOString().slice(0, 10), count: Number(r.c) })),
    sources: sources.map((s) => ({ source: s.utmSource, campaign: s.utmCampaign, count: s._count._all })),
    unattributed: Math.max(0, total - attributed),
  };
}
