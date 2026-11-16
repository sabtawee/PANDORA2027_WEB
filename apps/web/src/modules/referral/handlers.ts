import "server-only";
import { on } from "@/core/events";
import { qualifyReferral, recordReferral } from "./service";

on("user.registered", async ({ userId, context }) => {
  if (context.refCode) await recordReferral(userId, context.refCode, context.ip);
});

on("discord.joined", async ({ userId }) => {
  await qualifyReferral(userId);
});
