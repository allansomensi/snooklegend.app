import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { AppProviders } from "@/admin/components/providers";
import { THEME_SCRIPT } from "@/admin/lib/prefs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snook Legend · Staff",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
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
      </body>
    </html>
  );
}
