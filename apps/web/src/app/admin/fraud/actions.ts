"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/core/audit";
import { prisma } from "@/core/db/prisma";
import { requireRole } from "@/core/rbac";
import { qualifyReferral } from "@/modules/referral/service";

const schema = z.object({
  referralId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
});

/**
 * Approve: clear the flag; if the friend is already in Discord, pay the
 * inviter now (otherwise it pays normally when they join).
 * Reject: the referral never pays.
 */
export async function reviewReferral(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const v = schema.parse({ referralId: String(formData.get("referralId") ?? ""), decision: String(formData.get("decision") ?? "") });

  const ref = await prisma.referral.findUniqueOrThrow({ where: { id: v.referralId } });
  if (ref.status !== "PENDING" || !ref.flagged) redirect("/admin/fraud?ok=1");

  let paid = false;
  if (v.decision === "approve") {
    await prisma.referral.update({ where: { id: ref.id }, data: { flagged: false } });
    const inDiscord = await prisma.questProgress.findFirst({
      where: { userId: ref.inviteeId, status: "COMPLETED", quest: { key: "discord-join" } },
      select: { id: true },
    });
    if (inDiscord) paid = await qualifyReferral(ref.inviteeId);
  } else {
    await prisma.referral.update({ where: { id: ref.id }, data: { status: "REJECTED" } });
  }

  await audit(admin.id, `referral.${v.decision}`, ref.id, { inviterId: ref.inviterId, inviteeId: ref.inviteeId, paid });
  revalidatePath("/admin/fraud");
  redirect("/admin/fraud?ok=1");
}
