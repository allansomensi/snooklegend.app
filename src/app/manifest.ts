import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Snook Legend",
    short_name: "Snook Legend",
    description: "3D eight-ball pool for Windows, macOS and Linux.",
    start_url: "/",
    display: "standalone",
    background_color: "#040907",
    theme_color: "#040907",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
