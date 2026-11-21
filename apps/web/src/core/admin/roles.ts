import type { AdminRole } from "@/generated/prisma/client";

const RANK: Record<AdminRole, number> = { EDITOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };

export function adminHasRole(role: AdminRole, min: AdminRole) {
  return RANK[role] >= RANK[min];
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin — ทุกเมนู + จัดการแอดมิน",
  ADMIN: "Admin — ทุกเมนูยกเว้นจัดการแอดมิน",
  EDITOR: "Editor — เขียนข่าวเท่านั้น",
};
