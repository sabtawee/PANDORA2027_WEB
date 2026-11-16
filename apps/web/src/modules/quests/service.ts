import "server-only";
import { prisma } from "@/core/db/prisma";
import { awardPoints } from "@/modules/points/service";

/**
 * Complete a one-off quest by key and pay its points (amount comes from the
 * Quest row, so admin can change it). Idempotent per user + quest.
 */
export async function completeQuest(userId: string, questKey: string): Promise<boolean> {
  const quest = await prisma.quest.findUnique({ where: { key: questKey } });
  const now = new Date();
  if (!quest || !quest.isActive) return false;
  if (quest.startsAt && quest.startsAt > now) return false;
  if (quest.endsAt && quest.endsAt < now) return false;

  await prisma.questProgress.upsert({
    where: { userId_questId: { userId, questId: quest.id } },
    update: { status: "COMPLETED", completedAt: now, count: { increment: 1 } },
    create: { userId, questId: quest.id, status: "COMPLETED", completedAt: now, count: 1 },
  });

  return awardPoints({
    userId,
    amount: quest.points,
    reason: quest.type,
    refId: quest.id,
    dedupeKey: `quest:${quest.key}:${userId}`,
  });
}
