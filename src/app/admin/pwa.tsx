"use client";

import { useEffect } from "react";
import { paintThemeColor, prefs } from "@/admin/lib/prefs";

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

/**
 * Keeps a phone's bars (`theme-color`) in the theme chosen in the portal:
 * Next.js puts the layout's own tags back when the page changes, so they are
 * painted again whenever they change, and when the theme does.
 */
export function ThemeColor() {
  useEffect(() => {
    const paint = () => paintThemeColor(prefs.get().theme);
    paint();
    const watch = new MutationObserver(paint);
    watch.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["content"] });
    const unsubscribe = prefs.subscribe(paint);
    return () => {
      watch.disconnect();
      unsubscribe();
    };
  }, []);
  return null;
}
