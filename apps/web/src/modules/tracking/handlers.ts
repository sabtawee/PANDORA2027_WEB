import "server-only";
import { createHash } from "node:crypto";
import { on } from "@/core/events";
import { localeUrl } from "@/core/seo";
import { getSetting } from "@/core/settings";

const sha256 = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

/**
 * Meta Conversions API: server-side CompleteRegistration, deduplicated with
 * the browser pixel by event_id. Sent only if the visitor accepted cookies
 * before signing up (PDPA). Needs META_CAPI_TOKEN in env + pixel id in admin.
 */
on("user.registered", async ({ userId, email, context }) => {
  const token = process.env.META_CAPI_TOKEN;
  if (!token || !context.consent) return;
  const { metaPixelId } = await getSetting("tracking");
  if (!metaPixelId) return;

  const a = context.attribution;
  const userData: Record<string, unknown> = {
    external_id: [sha256(userId)],
    ...(email ? { em: [sha256(email)] } : {}),
    ...(context.ip ? { client_ip_address: context.ip } : {}),
    ...(context.userAgent ? { client_user_agent: context.userAgent } : {}),
    ...(context.fbp ? { fbp: context.fbp } : {}),
    ...(a?.fbclid ? { fbc: `fb.1.${a.ts ?? Date.now()}.${a.fbclid}` } : {}),
  };

  const version = process.env.META_GRAPH_VERSION || "v23.0";
  const res = await fetch(`https://graph.facebook.com/${version}/${metaPixelId}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [
        {
          event_name: "CompleteRegistration",
          event_time: Math.floor(Date.now() / 1000),
          event_id: `reg_${userId}`,
          action_source: "website",
          event_source_url: localeUrl("th", "/dashboard"),
          user_data: userData,
        },
      ],
      ...(process.env.META_CAPI_TEST_CODE ? { test_event_code: process.env.META_CAPI_TEST_CODE } : {}),
    }),
    cache: "no-store",
  });
  if (!res.ok) console.warn("[tracking] Meta CAPI failed", res.status, await res.text().catch(() => ""));
});
