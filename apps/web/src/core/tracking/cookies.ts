/** Cookie names shared by proxy (writer), auth events and client components (readers). */
export const REF_COOKIE = "pd_ref";
export const ATTR_COOKIE = "pd_attr";
export const CONSENT_COOKIE = "pd_consent";

/** First-touch window: an ad click is credited if the visitor signs up within 30 days. */
export const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 30;

export type ConsentValue = "all" | "necessary";

export interface AttributionCookie {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  landingPath?: string;
  referrer?: string;
  /** ms epoch of the click, for Meta's fbc parameter */
  ts?: number;
}

const PARAM_MAP: Record<string, keyof AttributionCookie> = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_content: "utmContent",
  utm_term: "utmTerm",
  fbclid: "fbclid",
  gclid: "gclid",
  ttclid: "ttclid",
};

/** Pull marketing params out of a URL. Returns null if there are none. */
export function attributionFromUrl(url: URL, referrer: string | null): AttributionCookie | null {
  const out: AttributionCookie = {};
  for (const [param, key] of Object.entries(PARAM_MAP)) {
    const v = url.searchParams.get(param);
    if (v) (out[key] as string) = v.slice(0, 250);
  }
  if (Object.keys(out).length === 0) return null;
  out.landingPath = url.pathname.slice(0, 250);
  if (referrer) out.referrer = referrer.slice(0, 250);
  out.ts = Date.now();
  return out;
}

export const REF_CODE_RE = /^[A-Z2-9]{6,12}$/;

/** Device fingerprint hash set by the login page (fraud checks only, never shared). */
export const FP_COOKIE = "pd_fp";
export const FP_RE = /^[a-f0-9]{64}$/;
