import type { MetadataRoute } from "next";
import en from "@/i18n/en";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-static";

// The website's (English, its default language; the staff portal has its own,
// src/app/admin/manifest.webmanifest).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: en.meta.description,
    lang: "en",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#040907",
    theme_color: "#040907",
    categories: ["games", "sports", "entertainment"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
