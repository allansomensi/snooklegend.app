import type { NextConfig } from "next";

// The site is a static export (the `out/` folder): it can be hosted on GitHub
// Pages, Vercel, Netlify, Cloudflare Pages or any web server.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  // One 404 page for the whole site (there are two root layouts).
  experimental: { globalNotFound: true },
  reactStrictMode: true,
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
