import "server-only";
import { prisma } from "@/core/db/prisma";
import { awardPoints } from "@/modules/points/service";

/** Link a new user to whoever invited them. Silently ignores bad / self codes. */
export async function recordReferral(inviteeId: string, refCode: string, inviteeIp: string | null) {
  const inviter = await prisma.user.findUnique({
    where: { referralCode: refCode },
    select: { id: true, status: true, signupIp: true },
  });
  if (!inviter || inviter.id === inviteeId || inviter.status !== "ACTIVE") return null;

  // Same signup IP as the inviter: could be a net café, could be one person
  // with two accounts. Keep it, but hold payout for admin review.
  const flagged = !!inviteeIp && inviter.signupIp === inviteeIp;

  return prisma.referral.create({ data: { inviterId: inviter.id, inviteeId, flagged } });
}

/**
 * The invitee has proved they're a real player (joined Discord), so pay the
 * inviter. Points come from the "referral" quest row, so admin controls it.
 */
export async function qualifyReferral(inviteeId: string): Promise<boolean> {
  const referral = await prisma.referral.findUnique({ where: { inviteeId } });
  if (!referral || referral.status !== "PENDING" || referral.flagged) return false;

  const quest = await prisma.quest.findUnique({ where: { key: "referral" } });
  if (!quest?.isActive) return false;
  if (quest.maxPerUser > 0) {
    const already = await prisma.referral.count({
      where: { inviterId: referral.inviterId, status: "QUALIFIED" },
    });
    if (already >= quest.maxPerUser) return false;
  }

  // Conditional update: only one concurrent caller can flip PENDING → QUALIFIED
  const { count } = await prisma.referral.updateMany({
    where: { id: referral.id, status: "PENDING" },
    data: { status: "QUALIFIED", qualifiedAt: new Date() },
  });
  if (count === 0) return false;

  return awardPoints({
    userId: referral.inviterId,
    amount: quest.points,
    reason: "REFERRAL",
    refId: referral.id,
    dedupeKey: `referral:${referral.id}`,
  });
}

export async function getReferralStats(inviterId: string) {
  const rows = await prisma.referral.groupBy({
    by: ["status"],
    where: { inviterId },
    _count: { _all: true },
  });
  const by = Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
  return { pending: by.PENDING ?? 0, qualified: by.QUALIFIED ?? 0 };
}
