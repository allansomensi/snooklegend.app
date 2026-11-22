import type { Dict } from "@/i18n";
import { Ball } from "./Ball";
import { DownloadButton } from "./DownloadButton";

export function FinalCta({ t, locale }: { t: Dict; locale: string }) {
  return (
    <section aria-labelledby="cta-title" className="relative pb-24 pt-8 sm:pb-32">
      <div className="container-page">
        <div data-reveal className="felt noise relative isolate overflow-hidden rounded-[2rem] px-6 py-16 text-center shadow-[0_40px_120px_-40px_rgb(15_108_57/0.8),inset_0_0_0_1px_rgb(255_255_255/0.1)] sm:rounded-[2.5rem] sm:px-12 sm:py-24">
          {/* Wooden rail around the cloth */}
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_10px_#5a2d17,inset_0_0_0_11px_rgb(255_220_180/0.15),inset_0_0_60px_10px_rgb(0_0_0/0.45)] sm:shadow-[inset_0_0_0_14px_#5a2d17,inset_0_0_0_15px_rgb(255_220_180/0.15),inset_0_0_80px_10px_rgb(0_0_0/0.45)]" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-3/4 -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(255_240_200/0.22),transparent)]" />

          <Ball n={8} size={72} className="absolute left-[7%] top-[18%] hidden animate-float sm:block" />
          <Ball n={0} size={50} className="absolute bottom-[16%] right-[9%] hidden animate-float [animation-delay:-3s] sm:block" />
          <Ball n={13} size={40} className="absolute right-[18%] top-[16%] hidden animate-float opacity-90 [animation-delay:-5s] md:block" />
          <Ball n={6} size={34} className="absolute bottom-[20%] left-[16%] hidden animate-float opacity-90 [animation-delay:-1.5s] md:block" />

          <h2 id="cta-title" className="font-display text-4xl font-extrabold tracking-[-0.03em] text-white drop-shadow-[0_4px_20px_rgb(0_0_0/0.35)] sm:text-6xl">
            {t.cta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-white/80">{t.cta.sub}</p>
          <div className="mt-9 flex justify-center">
            <DownloadButton t={{ hero: t.hero, os: t.os }} locale={locale} showMeta tone="cream" />
          </div>
        </div>
      </div>
    </section>
  );
}
