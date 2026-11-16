"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/core/auth";
import { verifyDiscordJoin } from "./service";

export type VerifyState = { result: Awaited<ReturnType<typeof verifyDiscordJoin>> | null };

// useActionState passes the previous state; this action doesn't need it.
export async function verifyDiscordAction(): Promise<VerifyState> {
  const session = await auth();
  if (!session?.user) return { result: null };
  const result = await verifyDiscordJoin(session.user.id);
  if (result === "done") revalidatePath("/[locale]/dashboard", "page");
  return { result };
}
