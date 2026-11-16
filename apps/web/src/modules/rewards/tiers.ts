import "server-only";
import { prisma } from "@/core/db/prisma";

export interface TierView {
  key: string;
  title: unknown;
  minPoints: number;
}

export interface TierProgress {
  current: TierView | null;
  next: TierView | null;
  /** 0-100 toward `next` (100 when at the top tier) */
  percent: number;
  tiers: TierView[];
}

export async function getActiveTiers(): Promise<TierView[]> {
  try {
    return await prisma.rewardTier.findMany({
      where: { isActive: true },
      orderBy: { minPoints: "asc" },
      select: { key: true, title: true, minPoints: true },
    });
  } catch {
    return [];
  }
}

/** Pure: where `points` sits on the tier ladder. */
export function resolveTier(points: number, tiers: TierView[]): TierProgress {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  const current = sorted.filter((t) => points >= t.minPoints).at(-1) ?? null;
  const next = sorted.find((t) => points < t.minPoints) ?? null;
  const floor = current?.minPoints ?? 0;
  const percent = next ? Math.max(0, Math.min(100, ((points - floor) / (next.minPoints - floor)) * 100)) : 100;
  return { current, next, percent, tiers: sorted };
}

/** Visual accent per tier key, so the badge reads at a glance. Unknown keys get gold. */
export const TIER_COLORS: Record<string, string> = {
  bronze: "#c08457",
  silver: "#c9cfd8",
  gold: "#f1cf7a",
  pandora: "#a982ff",
};
