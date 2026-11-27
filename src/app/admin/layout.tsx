import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { AppProviders } from "@/admin/components/providers";
import { THEME_COLORS, THEME_SCRIPT } from "@/admin/lib/prefs";
import { RegisterServiceWorker, ThemeColor } from "./pwa";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snook Legend · Staff",
  robots: { index: false, follow: false },
  // Installable on a phone (Add to Home Screen): the portal's own manifest and icons.
  manifest: "/admin/manifest.webmanifest",
  applicationName: "Snook Legend Staff",
  appleWebApp: { capable: true, title: "SL Staff", statusBarStyle: "black-translucent" },
  icons: { apple: [{ url: "/admin-icons/apple-touch-icon.png", sizes: "180x180" }] },
};

// The bars of a phone take the colour of the portal's background (--bg in
// globals.css): the system's theme first, then the one chosen in the
// portal (src/admin/lib/prefs.ts sets both tags to it). The page runs under
// a notch and the home indicator (viewport-fit=cover); globals.css keeps
// its bars clear of them with env(safe-area-inset-*).
export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The nonce of this page's Content Security Policy (src/proxy.ts).
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <noscript>
          <p style={{ padding: 24 }}>The staff portal needs JavaScript.</p>
        </noscript>
        <AppProviders>{children}</AppProviders>
        <RegisterServiceWorker />
        <ThemeColor />
      </body>
    </html>
  );
}
