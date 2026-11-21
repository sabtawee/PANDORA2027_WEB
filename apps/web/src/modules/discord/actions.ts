"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/core/auth";
import { rateLimit } from "@/core/security/rate-limit";
import { verifyDiscordJoin } from "./service";

export type VerifyState = { result: Awaited<ReturnType<typeof verifyDiscordJoin>> | null };

// useActionState passes the previous state; this action doesn't need it.
export async function verifyDiscordAction(): Promise<VerifyState> {
  const session = await auth();
  if (!session?.user) return { result: null };
  // Each check calls the Discord API; stop button-mashing from burning our rate limit
  if (!rateLimit(`discord-verify:${session.user.id}`, 5, 60_000).ok) return { result: null };
  const result = await verifyDiscordJoin(session.user.id);
  if (result === "done") revalidatePath("/[locale]/dashboard", "page");
  return { result };
}
