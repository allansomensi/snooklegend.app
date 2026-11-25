// The staff portal as an app on a phone ("Add to Home Screen"): its own
// name, icons and colours, and only the portal's pages (`/admin/`) in its
// window. Linked from the portal's layout only; the website has its own
// manifest (src/app/manifest.ts).

export const dynamic = "force-static";

const MANIFEST = {
  id: "/admin/",
  name: "Snook Legend Staff",
  short_name: "SL Staff",
  description: "The staff portal of Snook Legend: moderation, the lounge, events, the economy and the server.",
  start_url: "/admin/",
  scope: "/admin/",
  display: "standalone",
  orientation: "any",
  background_color: "#0e0c0a",
  theme_color: "#0e0c0a",
  icons: [
    { src: "/admin-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/admin-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/admin-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

export function GET() {
  return new Response(JSON.stringify(MANIFEST), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
