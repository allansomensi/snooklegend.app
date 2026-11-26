import { Check } from "lucide-react";
import type { Dict } from "@/i18n";
import { Ball } from "./Ball";
import { ReleaseBadge } from "./ReleaseBadge";
import { AllPlatformsLink, DownloadButton, MobileNotice } from "./DownloadButton";
import { Shot } from "./Shot";

type Props = { t: Dict; locale: string; shotsDir: string };

export function Hero({ t, locale, shotsDir }: Props) {
  return (
    <section className="relative isolate overflow-hidden pt-[calc(var(--header-h)+2.5rem)] sm:pt-[calc(var(--header-h)+4rem)]">
      {/* The pool hall, dimmed, behind everything */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <picture>
          <source media="(max-width: 640px)" srcSet="/art/hero-960.webp" />
          <source media="(max-width: 1280px)" srcSet="/art/hero-1600.webp" />
          <img
            src="/art/hero-2560.webp"
            alt=""
            fetchPriority="high"
            className="h-full max-h-[64rem] w-full object-cover object-[50%_70%] opacity-40 [mask-image:linear-gradient(180deg,#000_30%,transparent_92%)]"
          />
        </picture>
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_0%,rgb(255_226_160/0.20),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_30%,transparent_40%,var(--color-ink-950)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[58rem] bg-[radial-gradient(42%_30%_at_50%_42%,rgb(4_9_7/0.6),transparent)]" />
        <div className="absolute left-1/2 top-0 h-[38rem] w-[54rem] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_158deg,rgb(255_230_170/0.13)_172deg,rgb(255_230_170/0.20)_180deg,rgb(255_230_170/0.13)_188deg,transparent_202deg)] md:[animation:var(--animate-glow)]" />
      </div>

      {/* A few balls floating around */}
      <Ball n={8} size={64} className="absolute left-[6%] top-[22%] hidden animate-float opacity-90 md:block" />
      <Ball n={3} size={44} className="absolute right-[8%] top-[18%] hidden animate-float opacity-80 [animation-delay:-2s] md:block" />
      <Ball n={11} size={36} className="absolute right-[16%] top-[44%] hidden animate-float opacity-60 blur-[1px] [animation-delay:-4s] lg:block" />
      <Ball n={2} size={30} className="absolute left-[14%] top-[52%] hidden animate-float opacity-50 blur-[1.5px] [animation-delay:-1s] lg:block" />

      <div className="container-page relative text-center">
        <ReleaseBadge text={t.hero.badge} />

        {/* The page's heading says what the game is (for people and search engines), above the motto. */}
        <h1 className="rise mx-auto mt-7 max-w-4xl" style={{ ["--reveal-delay" as string]: "80ms" }}>
          <span className="block text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-300/90 sm:text-sm">{t.hero.eyebrow}</span>{" "}
          <span className="mt-4 block text-balance font-display text-[2.85rem] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-[5.6rem]">
            <span className="block text-cream">{t.hero.titleA}</span>{" "}
            <span className="block text-gold pb-2">{t.hero.titleB}</span>
          </span>
        </h1>

        <p
          style={{ ["--reveal-delay" as string]: "160ms" }}
          className="rise mx-auto mt-6 max-w-2xl text-pretty text-[17px] leading-relaxed text-mist sm:text-lg"
        >
          {t.hero.sub}
        </p>

        <div
          style={{ ["--reveal-delay" as string]: "240ms" }}
          className="rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-start"
        >
          <DownloadButton t={{ hero: t.hero, os: t.os }} locale={locale} showMeta />
          <AllPlatformsLink label={t.hero.allPlatforms} />
        </div>

        <MobileNotice t={{ hero: t.hero }} />

        <ul
          style={{ ["--reveal-delay" as string]: "320ms" }}
          className="rise mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-cream/70"
        >
          {t.hero.perks.map((p) => (
            <li key={p} className="flex items-center gap-1.5">
              <Check className="size-4 text-felt-400" /> {p}
            </li>
          ))}
        </ul>
      </div>

      {/* The game, framed */}
      <div className="rise container-page relative mt-14 sm:mt-20" style={{ ["--reveal-delay" as string]: "380ms" }}>
        <div className="pointer-events-none absolute inset-x-0 -bottom-28 top-[15%] -z-10 bg-[radial-gradient(closest-side,rgb(36_163_91/0.30),rgb(36_163_91/0.10)_55%,transparent)]" />
        <div className="mx-auto max-w-6xl [perspective:2000px]">
          <div className="overflow-hidden rounded-[18px] bg-ink-900 shadow-[0_50px_120px_-30px_rgb(0_0_0/0.95),0_0_0_1px_rgb(255_255_255/0.08)] [transform:rotateX(8deg)] transition-transform duration-1000 ease-[var(--ease-out-expo)] hover:[transform:rotateX(0deg)] sm:rounded-[22px]">
            <div className="flex h-8 items-center gap-2 border-b border-white/[0.06] bg-[#0d1210] px-4 sm:h-10">
              <span className="size-2.5 rounded-full bg-[#ff5f57]/90 sm:size-3" />
              <span className="size-2.5 rounded-full bg-[#febc2e]/90 sm:size-3" />
              <span className="size-2.5 rounded-full bg-[#28c840]/90 sm:size-3" />
              <span className="mx-auto pr-12 text-[11px] font-medium text-cream/70 sm:text-xs">{t.hero.windowTitle}</span>
            </div>
            <Shot dir={shotsDir} name="01-aim" alt={t.gallery.items[0]} priority sizes="(max-width: 1200px) 100vw, 1150px" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>
    </section>
  );
}
