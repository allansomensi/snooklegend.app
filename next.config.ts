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
  async redirects() {
    return [
      // A player's page in Portuguese is `/jogador/<name>/` (the address the
      // game shares); the one the other pages' scheme would give goes there.
      { source: "/pt/jogador/:name", destination: "/jogador/:name/", permanent: true },
    ];
  },
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
    ];
    // The site's pictures and icons keep their names when they change, so
    // they're kept a week, and used a month longer while checked again.
    const pictures = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }];
    return [
      { source: "/:path*", headers: [...common, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] },
      { source: "/:dir(shots|art|avatars|opponents|brand)/:file*", headers: pictures },
      { source: "/:file(og\\.jpg|flags\\.png)", headers: pictures },
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
  // A player's picture for social networks (`…/card.png`) draws their
  // profile picture, read from public/avatars when it's made.
  outputFileTracingIncludes: { "/**/card.png": ["./public/avatars/*.webp"] },
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
