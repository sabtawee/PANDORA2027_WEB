import "server-only";
import { prisma } from "@/core/db/prisma";
import { emit } from "@/core/events";
import { Prisma } from "@/generated/prisma/client";

export interface AwardInput {
  userId: string;
  amount: number;
  reason: string;
  /** Same key twice = second call is a no-op. */
  dedupeKey: string;
  refId?: string;
  note?: string;
}

/** Append a ledger row. Returns false if this dedupeKey was already paid. */
export async function awardPoints(input: AwardInput): Promise<boolean> {
  try {
    await prisma.pointLedger.create({ data: input });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return false;
    throw err;
  }
  await emit("points.awarded", { userId: input.userId, amount: input.amount, reason: input.reason });
  return true;
}

export async function getBalance(userId: string): Promise<number> {
  const { _sum } = await prisma.pointLedger.aggregate({ where: { userId }, _sum: { amount: true } });
  return _sum.amount ?? 0;
}

/** Points ever earned (ignores spending). Tiers use this so redeeming never drops a tier. */
export async function getLifetimeEarned(userId: string): Promise<number> {
  const { _sum } = await prisma.pointLedger.aggregate({
    where: { userId, amount: { gt: 0 } },
    _sum: { amount: true },
  });
  return _sum.amount ?? 0;
}

export async function getHistory(userId: string, take = 20) {
  return prisma.pointLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, amount: true, reason: true, note: true, createdAt: true },
  });
}
