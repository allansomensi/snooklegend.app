/* eslint-disable @next/next/no-html-link-for-pages -- a full page load is needed between root layouts */
import type { Metadata } from "next";
import { Document } from "@/components/Document";
import { EightBall } from "@/components/icons";

export const metadata: Metadata = {
  title: "404 · Snook Legend",
  description: "This page rolled into a pocket.",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <Document locale="en" redirect={false}>
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <EightBall className="mx-auto size-24 animate-float drop-shadow-[0_20px_30px_rgb(0_0_0/0.6)]" />
          <p className="mt-8 font-display text-7xl font-extrabold text-gold">404</p>
          <h1 className="mt-3 font-display text-2xl font-bold text-cream">Scratch! This page rolled into a pocket.</h1>
          <p className="mt-2 text-mist">
            Página não encontrada · Página no encontrada
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/" className="btn btn-felt h-12 px-6">Snook Legend</a>
            <a href="/pt/" className="btn btn-ghost h-12 px-5">Português</a>
            <a href="/es/" className="btn btn-ghost h-12 px-5">Español</a>
          </div>
        </div>
      </main>
    </Document>
  );
}
