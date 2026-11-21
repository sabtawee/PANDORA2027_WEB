import { auth } from "@/core/auth";
import { pickLocale } from "@/core/i18n/localized";
import { routing, type Locale } from "@/core/i18n/routing";
import { getBalance, getLifetimeEarned } from "@/modules/points/service";
import { getActiveTiers, resolveTier, TIER_COLORS } from "@/modules/rewards/tiers";

export interface MeResponse {
  user: null | {
    name: string | null;
    image: string | null;
    points: number;
    tier: { title: string; color: string } | null;
  };
}

/**
 * Who is signed in, for the navbar user menu. The header itself never reads
 * the session (so pages stay static); it asks this endpoint after load.
 */
export async function GET(req: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const session = await auth();
  if (!session?.user) return Response.json({ user: null } satisfies MeResponse, { headers });

  const q = new URL(req.url).searchParams.get("locale") ?? "";
  const locale: Locale = (routing.locales as readonly string[]).includes(q) ? (q as Locale) : routing.defaultLocale;
  const userId = session.user.id;
  const [points, lifetime, tiers] = await Promise.all([getBalance(userId), getLifetimeEarned(userId), getActiveTiers()]);
  const current = resolveTier(lifetime, tiers).current;

  return Response.json(
    {
      user: {
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        points,
        tier: current ? { title: pickLocale(current.title, locale), color: TIER_COLORS[current.key] ?? "var(--gold)" } : null,
      },
    } satisfies MeResponse,
    { headers },
  );
}
