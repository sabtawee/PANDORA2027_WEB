import "server-only";
import { prisma } from "@/core/db/prisma";

const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Monday 00:00 Bangkok time of the current week, as a UTC Date. */
export function weekStartBangkok(now = new Date()): Date {
  const bkk = new Date(now.getTime() + BKK_OFFSET_MS);
  const daysSinceMonday = (bkk.getUTCDay() + 6) % 7;
  bkk.setUTCDate(bkk.getUTCDate() - daysSinceMonday);
  bkk.setUTCHours(0, 0, 0, 0);
  return new Date(bkk.getTime() - BKK_OFFSET_MS);
}

/** "Somchai Jaidee" → "Som•••". Public page, so never show a full name. */
export function maskName(name: string | null): string {
  const first = name?.trim().split(/\s+/)[0] ?? "";
  if (!first) return "•••";
  const graphemes = [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(first)].map((s) => s.segment);
  return `${graphemes.slice(0, Math.min(3, Math.max(1, graphemes.length - 1))).join("")}•••`;
}

export interface LeaderRow {
  rank: number;
  userId: string;
  name: string;
  count: number;
}

/**
 * Top inviters by qualified referrals. Ties go to whoever reached the count
 * first (earliest latest-qualification).
 */
export async function getLeaderboard(since: Date | null, take = 20): Promise<LeaderRow[]> {
  try {
    const rows = await prisma.referral.groupBy({
      by: ["inviterId"],
      where: { status: "QUALIFIED", ...(since ? { qualifiedAt: { gte: since } } : {}) },
      _count: { _all: true },
      _max: { qualifiedAt: true },
      orderBy: [{ _count: { inviterId: "desc" } }, { _max: { qualifiedAt: "asc" } }],
      take,
    });
    const users = await prisma.user.findMany({
      where: { id: { in: rows.map((r) => r.inviterId) }, status: "ACTIVE" },
      select: { id: true, name: true },
    });
    const names = new Map(users.map((u) => [u.id, u.name]));
    return rows
      .filter((r) => names.has(r.inviterId))
      .map((r, i) => ({ rank: i + 1, userId: r.inviterId, name: maskName(names.get(r.inviterId) ?? null), count: r._count._all }));
  } catch {
    return [];
  }
}
