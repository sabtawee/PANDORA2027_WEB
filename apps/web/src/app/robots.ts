import type { MetadataRoute } from "next";
import { SITE_URL } from "@/core/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // login/dashboard stay crawlable so bots can see their noindex tag;
        // ?ref= links canonicalize back to the landing page.
        disallow: ["/api/", "/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
