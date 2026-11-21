import "server-only";
import { prisma } from "@/core/db/prisma";
import type { AdminLoginEvent } from "@/generated/prisma/client";
import { requestMeta } from "./request";

/** Record a sign-in attempt or sign-out. Called for every outcome, good or bad. */
export async function logAdminLogin(input: { adminId: string | null; username: string; event: AdminLoginEvent; reason: string }) {
  const { ip, userAgent } = await requestMeta();
  await prisma.adminLoginLog.create({
    data: { ...input, username: input.username.slice(0, 80), ip, userAgent },
  });
}
