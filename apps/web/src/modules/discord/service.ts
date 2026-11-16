import "server-only";
import { prisma } from "@/core/db/prisma";
import { emit } from "@/core/events";
import { completeQuest } from "@/modules/quests/service";

const API = "https://discord.com/api/v10";

function config() {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !botToken) return null;
  return { guildId, botToken, roleId: process.env.DISCORD_PREREG_ROLE_ID || null };
}

async function discord(path: string, init: RequestInit & { botToken: string }) {
  const { botToken, ...rest } = init;
  return fetch(`${API}${path}`, {
    ...rest,
    headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json", ...rest.headers },
    cache: "no-store",
  });
}

/**
 * Add the player to our Discord server using the guilds.join token they just
 * granted. 201 = added, 204 = already a member. Needs the bot in the server
 * with "Create Invite" permission.
 */
export async function addToGuild(discordUserId: string, accessToken: string): Promise<boolean> {
  const cfg = config();
  if (!cfg) return false;
  const res = await discord(`/guilds/${cfg.guildId}/members/${discordUserId}`, {
    method: "PUT",
    botToken: cfg.botToken,
    body: JSON.stringify({ access_token: accessToken, ...(cfg.roleId ? { roles: [cfg.roleId] } : {}) }),
  });
  if (res.status === 204 && cfg.roleId) {
    // Already a member: PUT ignores `roles`, so add the pre-register role separately
    await discord(`/guilds/${cfg.guildId}/members/${discordUserId}/roles/${cfg.roleId}`, {
      method: "PUT",
      botToken: cfg.botToken,
    });
  }
  if (!res.ok) console.warn("[discord] add to guild failed", res.status, await res.text().catch(() => ""));
  return res.ok;
}

export async function isGuildMember(discordUserId: string): Promise<boolean> {
  const cfg = config();
  if (!cfg) return false;
  const res = await discord(`/guilds/${cfg.guildId}/members/${discordUserId}`, { method: "GET", botToken: cfg.botToken });
  return res.ok;
}

/**
 * Check the user's linked Discord account is in our server, and if so complete
 * the quest. Emits discord.joined only the first time. Safe to call repeatedly.
 */
export async function verifyDiscordJoin(userId: string): Promise<"done" | "not-linked" | "not-member" | "unconfigured"> {
  if (!config()) return "unconfigured";
  const account = await prisma.account.findFirst({ where: { userId, provider: "discord" } });
  if (!account) return "not-linked";
  if (!(await isGuildMember(account.providerAccountId))) return "not-member";

  const firstTime = await completeQuest(userId, "discord-join");
  if (firstTime) await emit("discord.joined", { userId, discordId: account.providerAccountId });
  return "done";
}

export function discordInviteConfigured() {
  return config() !== null;
}
