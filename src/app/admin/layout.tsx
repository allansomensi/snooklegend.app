import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { AppProviders } from "@/admin/components/providers";
import { THEME_SCRIPT } from "@/admin/lib/prefs";
import { RegisterServiceWorker } from "./pwa";
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

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#0e0c0a",
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
      </body>
    </html>
  );
}
