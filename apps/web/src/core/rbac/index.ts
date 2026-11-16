import "server-only";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/core/auth";
import type { Role } from "@/generated/prisma/client";

const RANK: Record<Role, number> = { USER: 0, EDITOR: 1, GM: 2, ADMIN: 3 };

export function hasRole(role: Role, min: Role) {
  return RANK[role] >= RANK[min];
}

/**
 * Gate for admin pages AND server actions (actions are public endpoints, so
 * each one must call this itself). Signed-out → login; too low → 404, so the
 * admin area isn't advertised to regular players.
 */
export async function requireRole(min: Role) {
  const session = await auth();
  if (!session?.user) redirect("/th/login");
  if (!hasRole(session.user.role, min)) notFound();
  return session.user;
}
