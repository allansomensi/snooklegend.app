import {
  Bot,
  CalendarDays,
  Cpu,
  Crosshair,
  Languages,
  MessagesSquare,
  Palette,
  ShieldCheck,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Dict } from "@/i18n";
import { Ball } from "./Ball";
import { SectionHeading } from "./Section";
import { Shot } from "./Shot";

type Props = { t: Dict; shotsDir: string };

export function Features({ t, shotsDir }: Props) {
  const f = t.features.items;
  return (
    <section id="features" aria-labelledby="features-title" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-40 -z-10 mx-auto h-[30rem] max-w-5xl rounded-full bg-felt-700/10 blur-[120px]" />
      <div className="container-page">
        <SectionHeading id="features-title" kicker={t.features.kicker} title={t.features.title} sub={t.features.sub} />

        <div className="mt-16 grid gap-4 md:grid-cols-6">
          {/* Physics: wide, with a picture */}
          <Tile className="md:col-span-4" delay={0}>
            <div className="grid h-full gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-center">
              <TileText icon={<Zap />} title={f.physics.title} text={f.physics.text} />
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
                <Shot dir={shotsDir} name="03-elevation" alt="" sizes="(max-width: 768px) 100vw, 480px" className="h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/50 to-transparent" />
              </div>
            </div>
          </Tile>

          {/* The cue: the tip wandering over the cue ball */}
          <Tile className="md:col-span-2" delay={70}>
            <TileText icon={<Crosshair />} title={f.cue.title} text={f.cue.text} />
            <div className="mt-6 flex justify-center">
              <div className="relative">
                <Ball n={0} size={128} />
                <span className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="absolute h-px w-[78%] bg-black/15" />
                  <span className="absolute h-[78%] w-px bg-black/15" />
                </span>
                <span
                  className="absolute left-1/2 top-1/2 size-5 rounded-full bg-[#d42a24] shadow-[0_0_0_4px_rgb(212_42_36/0.25)]"
                  style={{ animation: "tip-wander 9s var(--ease-out-expo) infinite" }}
                />
              </div>
            </div>
          </Tile>

          {/* Online lounge */}
          <Tile className="md:col-span-2" delay={0}>
            <TileText icon={<MessagesSquare />} title={f.online.title} text={f.online.text} />
            <ul className="mt-6 space-y-2" aria-hidden="true">
              {[
                ["rosa", "Rosa", 1532, "#22c55e"],
                ["kenji", "Kenji", 1618, "#22c55e"],
                ["amara", "Amara", 1404, "#a855f7"],
              ].map(([img, name, rating, dot]) => (
                <li key={img as string} className="flex items-center gap-3 rounded-xl bg-white/[0.035] px-3 py-2 ring-1 ring-white/[0.06]">
                  <span className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/opponents/${img}.webp`} alt="" width={32} height={32} loading="lazy" className="size-8 rounded-full" />
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-ink-850" style={{ background: dot as string }} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-cream/90">{name}</span>
                  <span className="font-mono text-xs text-gold-300">{rating}</span>
                  <span className="rounded-full bg-felt-600/30 px-2.5 py-1 text-[11px] font-semibold text-felt-300 ring-1 ring-felt-400/30">▶</span>
                </li>
              ))}
            </ul>
          </Tile>

          {/* Tournaments: a bracket */}
          <Tile className="md:col-span-2" delay={70}>
            <TileText icon={<Trophy />} title={f.tournaments.title} text={f.tournaments.text} />
            <svg viewBox="0 0 220 110" className="mt-6 w-full text-white/20" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12h40v20h-40M10 52h40v-20M10 62h40v20h-40M10 102h40v-20M50 32h40v25h-40M50 82h40v-25" />
                <path d="M210 12h-40v20h40M210 52h-40v-20M210 62h-40v20h40M210 102h-40v-20M170 32h-40v25h40M170 82h-40v-25" />
              </g>
              <path d="M90 57h40" stroke="#e8bc5e" strokeWidth="2" />
              <circle cx="110" cy="57" r="13" fill="#e8bc5e" />
              <path d="M104.5 51h11v4.5a5.5 5.5 0 0 1-11 0zM108 61h4v3h3v2h-10v-2h3z" fill="#2b1a05" />
            </svg>
          </Tile>

          {/* Opponents */}
          <Tile className="md:col-span-2" delay={140}>
            <TileText icon={<Bot />} title={f.opponents.title} text={f.opponents.text} />
            <div className="mt-6 flex items-center" aria-hidden="true">
              {["leo", "nina", "tito", "lola", "otto", "viktor"].map((n, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={n}
                  src={`/opponents/${n}.webp`}
                  alt=""
                  width={48}
                  height={48}
                  loading="lazy"
                  className="-ml-3 size-12 rounded-full ring-4 ring-ink-850 first:ml-0"
                  style={{ zIndex: 10 - i }}
                />
              ))}
              <span className="-ml-3 grid size-12 place-items-center rounded-full bg-ink-700 text-sm font-bold text-gold-300 ring-4 ring-ink-850">
                +9
              </span>
            </div>
          </Tile>

          {/* Daily challenge and drills */}
          <Tile className="md:col-span-2" delay={0}>
            <TileText icon={<CalendarDays />} title={f.daily.title} text={f.daily.text} />
            <div className="mt-6 flex items-end gap-2" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <Star
                  key={i}
                  className={`${i === 1 ? "size-14 -translate-y-2" : "size-11"} ${i < 2 ? "fill-gold-400 text-gold-400 drop-shadow-[0_6px_14px_rgb(232_188_94/0.45)]" : "text-gold-400/40"}`}
                />
              ))}
            </div>
          </Tile>

          {/* Style: themed halls */}
          <Tile className="md:col-span-4" delay={70} flush>
            <div className="relative h-full min-h-[18rem]">
              <Shot
                dir={shotsDir}
                name="04-hall"
                alt=""
                sizes="(max-width: 768px) 100vw, 760px"
                className="absolute inset-0 h-full object-cover object-[50%_40%]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/70 to-transparent" />
              <div className="relative max-w-sm p-7 sm:p-8">
                <TileText icon={<Palette />} title={f.style.title} text={f.style.text} />
              </div>
            </div>
          </Tile>

          {/* Runs anywhere */}
          <Tile className="md:col-span-2" delay={0}>
            <TileText icon={<Cpu />} title={f.anywhere.title} text={f.anywhere.text} />
            <div className="mt-6 flex rounded-full bg-black/30 p-1 ring-1 ring-white/10" aria-hidden="true">
              {t.features.presets.map((p, i) => (
                <span
                  key={p}
                  className={`flex-1 rounded-full py-1.5 text-center text-xs font-semibold ${
                    i === 3 ? "bg-gradient-to-b from-gold-300 to-gold-500 text-[#2b1a05]" : "text-cream/60"
                  }`}
                >
                  {p}
                </span>
              ))}
            </div>
          </Tile>

          {/* Fair play */}
          <Tile className="md:col-span-2" delay={70}>
            <TileText icon={<ShieldCheck />} title={f.fair.title} text={f.fair.text} />
          </Tile>

          {/* Languages */}
          <Tile className="md:col-span-2" delay={140} flush>
            <div className="p-7 sm:p-8">
              <TileText icon={<Languages />} title={f.languages.title} text={f.languages.text} />
            </div>
            <div className="relative overflow-hidden pb-7 [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]" aria-hidden="true">
              <div className="flex w-max animate-marquee gap-3">
                {[...GREETINGS, ...GREETINGS].map((g, i) => (
                  <span key={i} className="whitespace-nowrap rounded-full bg-white/[0.05] px-3.5 py-1.5 text-sm text-cream/80 ring-1 ring-white/10">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}

const GREETINGS = [
  "Olá",
  "Hello",
  "Hola",
  "Bonjour",
  "Hallo",
  "Ciao",
  "Привет",
  "Merhaba",
  "こんにちは",
  "안녕하세요",
  "你好",
  "مرحبا",
  "नमस्ते",
  "হ্যালো",
  "สวัสดี",
  "Xin chào",
  "Γειά σου",
  "Cześć",
  "Ahoj",
  "Szia",
  "Salut",
  "Hej",
  "Halo",
  "Kumusta",
  "Привіт",
];

function Tile({
  children,
  className = "",
  delay = 0,
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  flush?: boolean;
}) {
  return (
    <article
      data-reveal
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
      className={`card noise group overflow-hidden transition-[box-shadow,transform] duration-500 hover:-translate-y-1 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.09),inset_0_0_0_1px_rgb(232_188_94/0.22),0_30px_60px_-30px_rgb(0_0_0/0.8)] ${
        flush ? "" : "p-7 sm:p-8"
      } ${className}`}
    >
      {children}
    </article>
  );
}

function TileText({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div>
      <div className="mb-5 grid size-11 place-items-center rounded-xl bg-gradient-to-b from-gold-300/20 to-gold-500/5 text-gold-300 ring-1 ring-gold-400/25 [&>svg]:size-5">
        {icon}
      </div>
      <h3 className="font-display text-xl font-bold tracking-tight text-cream sm:text-[1.35rem]">{title}</h3>
      <p className="mt-2.5 text-[15px] leading-relaxed text-mist">{text}</p>
    </div>
  );
}
