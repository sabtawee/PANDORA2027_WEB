import "server-only";
import { on } from "@/core/events";
import { completeQuest } from "@/modules/quests/service";

// Signup bonus. Referral + attribution capture subscribe here in week 2.
on("user.registered", async ({ userId }) => {
  await completeQuest(userId, "signup");
});
