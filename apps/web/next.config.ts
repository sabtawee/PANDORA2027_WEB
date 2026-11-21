import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/core/i18n/request.ts");

const nextConfig: NextConfig = {
  // cacheComponents is off for now: Auth.js v5 and next-intl don't support it yet.
  // Revisit once both libraries document Cache Components support.
  transpilePackages: ["@pandora/shared"],
  experimental: {
    // Admin image uploads (max 2 MB each, see core/media/storage.ts) + form overhead
    serverActions: { bodySizeLimit: "3mb" },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
