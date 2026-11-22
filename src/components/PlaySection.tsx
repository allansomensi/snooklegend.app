import type { Dict } from "@/i18n";
import { PoolTable } from "./PoolTable";
import { SectionHeading } from "./Section";

export function PlaySection({ t }: { t: Dict }) {
  return (
    <section id="play" aria-labelledby="play-title" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-24 h-[34rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_226_160/0.10),transparent)]" />
      </div>
      <div className="container-page">
        <SectionHeading id="play-title" kicker={t.play.kicker} title={t.play.title} sub={t.play.sub} />
        <div data-reveal className="mx-auto mt-14 max-w-5xl">
          <div className="card noise p-4 sm:p-6 lg:p-8">
            <PoolTable t={t.play} />
          </div>
        </div>
      </div>
    </section>
  );
}
