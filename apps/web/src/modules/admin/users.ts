import "server-only";
import { prisma } from "@/core/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const USERS_PAGE_SIZE = 30;

/** Search by email, name, referral code, user id or signup IP. */
export async function searchUsers(q: string, page: number) {
  const term = q.trim();
  const where: Prisma.UserWhereInput = term
    ? {
        OR: [
          { email: { contains: term } },
          { name: { contains: term } },
          { referralCode: term.toUpperCase() },
          { id: term },
          { signupIp: term },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        referralCode: true,
        createdAt: true,
        accounts: { select: { provider: true } },
      },
    }),
  ]);

  const sums = await prisma.pointLedger.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) } },
    _sum: { amount: true },
  });
  const balance = new Map(sums.map((s) => [s.userId, s._sum.amount ?? 0]));

  return {
    total,
    pages: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)),
    users: users.map((u) => ({ ...u, balance: balance.get(u.id) ?? 0 })),
  };
}

export async function getUserDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: { select: { provider: true, providerAccountId: true, createdAt: true } },
      attribution: true,
      invitedBy: { include: { inviter: { select: { id: true, name: true, email: true } } } },
      invites: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { invitee: { select: { id: true, name: true, email: true, status: true } } },
      },
      quests: { include: { quest: { select: { key: true, title: true } } } },
    },
  });
  if (!user) return null;

  const [ledger, sums, sameIp] = await Promise.all([
    prisma.pointLedger.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.pointLedger.aggregate({ where: { userId: id }, _sum: { amount: true } }),
    user.signupIp
      ? prisma.user.count({ where: { signupIp: user.signupIp, id: { not: id } } })
      : Promise.resolve(0),
  ]);

  return { user, ledger, balance: sums._sum.amount ?? 0, sameIp };
}
