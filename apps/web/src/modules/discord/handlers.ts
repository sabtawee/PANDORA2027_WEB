import "server-only";
import { on } from "@/core/events";
import { addToGuild, verifyDiscordJoin } from "./service";

// Fired by core/auth whenever a Discord account is linked (first sign-up or later).
on("discord.linked", async ({ userId, discordId, accessToken }) => {
  if (accessToken) await addToGuild(discordId, accessToken);
  await verifyDiscordJoin(userId);
});
