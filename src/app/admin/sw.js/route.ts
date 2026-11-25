// The staff portal's service worker (registered by src/app/admin/pwa.tsx,
// for `/admin/` only). Deliberately small: it makes the portal installable
// and shows a page of its own when there is no connection. It keeps no
// page and nothing from the API: every page is asked of the network (pages
// are made per request, each with its own Content Security Policy nonce),
// the API lives on another origin it never touches, and only the build's
// static files (scripts, styles, fonts, icons: the same for everyone, no
// data) are kept as a fallback.

export const dynamic = "force-static";

const VERSION = "1";

const WORKER = `
const CACHE = "sl-staff-v${VERSION}";
const OFFLINE = "/admin/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/admin-icons/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("sl-staff-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** The build's files and the icons: public, the same for everyone. */
function isStatic(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/admin-icons/");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // The API (another origin) and anything else not the portal's own: untouched.
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    // A page: always the network; without one, the offline page.
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (isStatic(url)) {
    // Network first; the copy kept is only for when there is no network.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || Response.error())),
    );
  }
});
`;

export function GET() {
  return new Response(WORKER, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      // Checked for a new version at every visit.
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/admin/",
    },
  });
}
