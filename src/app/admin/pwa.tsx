"use client";

import { useEffect } from "react";

/**
 * Registers the portal's service worker (src/app/admin/sw.js), for `/admin/`
 * only, so the portal can be installed on a phone and says so when there is
 * no connection. Not while developing: it would get in the way of reloads.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" }).catch(() => {
      // Not installable then; the portal works the same.
    });
  }, []);
  return null;
}
