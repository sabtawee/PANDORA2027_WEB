import "server-only";
import { headers } from "next/headers";

/** Client IP behind Cloudflare / a reverse proxy. */
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}
