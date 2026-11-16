import "server-only";
import { prisma } from "@/core/db/prisma";
import { on } from "@/core/events";
import { completeQuest } from "@/modules/quests/service";

// Signup bonus
on("user.registered", async ({ userId }) => {
  await completeQuest(userId, "signup");
});

// First-touch ad attribution + signup IP (used later by fraud review)
on("user.registered", async ({ userId, context }) => {
  await prisma.user.update({ where: { id: userId }, data: { signupIp: context.ip } });

  const a = context.attribution;
  if (!a) return;
  await prisma.attribution.create({
    data: {
      userId,
      utmSource: a.utmSource,
      utmMedium: a.utmMedium,
      utmCampaign: a.utmCampaign,
      utmContent: a.utmContent,
      utmTerm: a.utmTerm,
      fbclid: a.fbclid,
      gclid: a.gclid,
      ttclid: a.ttclid,
      landingPath: a.landingPath,
      referrer: a.referrer,
    },
  });
});
