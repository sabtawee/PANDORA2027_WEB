import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/core/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Record an admin change. Every admin write must call this. */
export async function audit(actorId: string, action: string, target: string | null, data?: unknown) {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await prisma.auditLog.create({
    data: { actorId, action, target, data: data as Prisma.InputJsonValue, ip },
  });
}
