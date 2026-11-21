import "server-only";
import { requestMeta } from "@/core/admin/request";
import { prisma } from "@/core/db/prisma";
import type { AuditOp, Prisma } from "@/generated/prisma/client";

export interface AuditEntry {
  /** Staff member (AdminUser.id). null = system / automated. */
  adminId: string | null;
  op: AuditOp;
  /** e.g. "news.update" */
  action: string;
  /** e.g. "news", "quest", "user" */
  entity?: string;
  /** id / key of the changed record */
  target?: string | null;
  /** Record as it was before the change (UPDATE / DELETE) */
  before?: unknown;
  /** Record as it is after the change (CREATE / UPDATE) */
  after?: unknown;
  /** Anything else worth keeping (reason, counts …) */
  data?: unknown;
}

const json = (v: unknown) => (v === undefined || v === null ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue));

/** Record a back-office change. Every admin write must call this. */
export async function audit(e: AuditEntry) {
  const { ip, userAgent } = await requestMeta();
  await prisma.auditLog.create({
    data: {
      adminId: e.adminId,
      op: e.op,
      action: e.action,
      entity: e.entity ?? e.action.split(".")[0],
      target: e.target?.slice(0, 120) ?? null,
      before: json(e.before),
      after: json(e.after),
      data: json(e.data),
      ip,
      userAgent,
    },
  });
}
