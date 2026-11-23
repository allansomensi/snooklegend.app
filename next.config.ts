import type { NextConfig } from "next";

// One app on Vercel: the website (/, /pt/, /es/…, prerendered at build time
// and served from the CDN) and the staff portal (/admin, rendered per
// request: each page gets its own nonce for the Content Security Policy, see
// src/proxy.ts). The game server (the API) runs elsewhere: NEXT_PUBLIC_API_URL.
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  // One 404 page for the whole site (there are several root layouts).
  experimental: { globalNotFound: true },
  reactStrictMode: true,
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
    ];
    return [
      { source: "/:path*", headers: [...common, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
      {
        // The staff portal: never in a frame, no referrer, never in a search engine.
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
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

export default nextConfig;
