import "server-only";
import { prisma } from "@/core/db/prisma";
import { REF_CODE_RE } from "@/core/tracking/cookies";
import { getLifetimeEarned } from "@/modules/points/service";
import { getActiveTiers, resolveTier, type TierView } from "@/modules/rewards/tiers";

export interface InviteCard {
  code: string;
  /** First word of the display name only — the card is public. */
  firstName: string | null;
  tier: TierView | null;
}

export async function getInviteCard(rawCode: string): Promise<InviteCard | null> {
  const code = rawCode.toUpperCase();
  if (!REF_CODE_RE.test(code)) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, name: true, status: true },
    });
    if (!user || user.status !== "ACTIVE") return null;
    const [lifetime, tiers] = await Promise.all([getLifetimeEarned(user.id), getActiveTiers()]);
    const firstName = user.name?.trim().split(/\s+/)[0]?.slice(0, 20) || null;
    return { code, firstName, tier: resolveTier(lifetime, tiers).current };
  } catch {
    return null;
  }
}

export function invitePath(code: string) {
  return `/i/${code}`;
}
