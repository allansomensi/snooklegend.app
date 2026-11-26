import { Globe, Plus } from "lucide-react";
import { Fragment } from "react";
import { getDict, LOCALE_INFO, type Locale } from "@/i18n";
import { pagePath, pathsOf } from "@/lib/routes";
import { readRules, RULES_UPDATED, type GuidePart } from "@/lib/rules-guide";
import { SCENE_AT, type SceneKey } from "@/lib/scenes";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { faqEntities, ORG_ID, WEBSITE_ID } from "@/lib/structured-data";
import { Flag } from "./Flag";
import { RuleScene } from "./RuleScene";
import { SceneFigure } from "./SceneFigure";
import { Breadcrumbs, DownloadCta, JsonLd, PageHeader, SiteFrame } from "./SiteFrame";

/**
 * The rules guide: both sets of rules, word for word as the game shows them,
 * with animated tables, a side-by-side comparison and the common questions.
 */
export async function RulesGuide({ locale }: { locale: Locale }) {
  const d = getDict(locale);
  const g = d.guide;
  const path = pagePath(locale, "rules");
  const sets = [
    { key: "brazilian" as const, id: "brazilian", title: g.brTitle, intro: g.brIntro, parts: readRules("brazilian", locale) },
    { key: "official" as const, id: "official", title: g.wpaTitle, intro: g.wpaIntro, parts: readRules("official", locale) },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${SITE_URL + path}#article`,
      headline: g.title,
      description: g.description,
      inLanguage: LOCALE_INFO[locale].htmlLang,
      url: SITE_URL + path,
      mainEntityOfPage: SITE_URL + path,
      isPartOf: { "@id": WEBSITE_ID },
      image: `${SITE_URL}/og.jpg`,
      dateModified: `${RULES_UPDATED}T12:00:00Z`,
      author: { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, url: `${SITE_URL}/` },
      publisher: { "@type": "Organization", "@id": ORG_ID, name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/icon-512.png` } },
      about: [
        { "@type": "Thing", name: "Eight-ball", sameAs: "https://en.wikipedia.org/wiki/Eight-ball" },
        { "@type": "Thing", name: g.brTitle },
        { "@type": "Thing", name: g.wpaTitle },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntities(g.faq),
    },
  ];

  const toc = [
    { id: "compare", title: g.compareTitle },
    ...sets.map((s) => ({ id: s.id, title: s.title, sub: s.parts.map((p) => ({ id: p.id, title: p.title })) })),
    { id: "faq", title: g.faqTitle },
  ];

  return (
    <SiteFrame locale={locale} paths={pathsOf((l) => pagePath(l, "rules"))}>
      <JsonLd data={jsonLd} />
      <Breadcrumbs locale={locale} items={[{ name: g.shortTitle, path }]} />
      <div className="container-page mt-8">
        <PageHeader kicker={g.kicker} title={g.heading} sub={g.sub}>
          <nav aria-label={g.jump} className="mt-8 flex flex-wrap justify-center gap-2">
            <a href="#brazilian" className="btn btn-ghost h-11 px-5 text-[15px]">
              <Flag code="BR" height={13} /> {g.brTitle}
            </a>
            <a href="#official" className="btn btn-ghost h-11 px-5 text-[15px]">
              <Globe className="size-4 text-sky-300" aria-hidden /> {g.wpaTitle}
            </a>
          </nav>
        </PageHeader>

        <div className="mx-auto mt-14 grid max-w-6xl gap-12 lg:grid-cols-[15rem_minmax(0,1fr)]">
          {/* The table of contents: beside the text on a wide screen. */}
          <nav aria-labelledby="toc-title" className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100dvh-var(--header-h)-3rem)] overflow-y-auto pr-2">
              <p id="toc-title" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300/90">
                {d.common.toc}
              </p>
              <ol className="mt-3 space-y-1 text-[14px]">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="block rounded-lg px-2 py-1.5 font-semibold text-cream/85 transition hover:bg-white/[0.05] hover:text-cream">
                      {item.title}
                    </a>
                    {"sub" in item && item.sub && (
                      <ol className="mb-2 ml-2 border-l border-white/[0.08] pl-2">
                        {item.sub.map((s) => (
                          <li key={s.id}>
                            <a href={`#${s.id}`} className="block rounded-lg px-2 py-1 text-[13px] text-mist transition hover:bg-white/[0.04] hover:text-cream">
                              {s.title}
                            </a>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="min-w-0">
            {/* The table of contents on a phone: folded. */}
            <details className="mb-10 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07] lg:hidden">
              <summary className="cursor-pointer px-5 py-4 font-semibold text-cream">{d.common.toc}</summary>
              <ol className="space-y-1 px-5 pb-4 text-[15px]">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="block py-1 text-cream/85 hover:text-gold-200">
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            <section id="compare" aria-labelledby="compare-title" className="scroll-mt-28">
              <h2 id="compare-title" className="font-display text-3xl font-bold tracking-tight text-cream">
                {g.compareTitle}
              </h2>
              <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-white/[0.08]">
                <table className="w-full border-collapse text-left text-[14.5px]">
                  <caption className="sr-only">{g.compareCaption}</caption>
                  <thead className="hidden bg-white/[0.04] md:table-header-group">
                    <tr className="text-[12px] font-semibold uppercase tracking-[0.12em] text-fog">
                      <td className="w-[22%] px-4 py-3" />
                      <th scope="col" className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <Flag code="BR" height={11} /> {g.brTitle}
                        </span>
                      </th>
                      <th scope="col" className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <Globe className="size-3.5 text-sky-300" aria-hidden /> {g.wpaTitle}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.compareRows.map((r) => (
                      <tr key={r.what} className="block border-t border-white/[0.06] first:border-t-0 md:table-row md:first:border-t">
                        <th scope="row" className="block px-4 pt-4 font-display text-[16px] font-bold text-gold-200 md:table-cell md:py-4 md:align-top">
                          {r.what}
                        </th>
                        <td data-label={g.brTitle} className="compare-cell block px-4 py-2 leading-relaxed text-cream/85 md:table-cell md:py-4 md:align-top">
                          {r.br}
                        </td>
                        <td data-label={g.wpaTitle} className="compare-cell block px-4 pb-4 pt-2 leading-relaxed text-cream/85 md:table-cell md:py-4 md:align-top">
                          {r.wpa}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {sets.map((set) => (
              <section key={set.id} id={set.id} aria-labelledby={`${set.id}-title`} className="mt-20 scroll-mt-28">
                <h2 id={`${set.id}-title`} className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl">
                  {set.key === "brazilian" ? <Flag code="BR" height={22} /> : <Globe className="size-7 text-sky-300" aria-hidden />}
                  {set.title}
                </h2>
                <p className="mt-4 max-w-3xl text-pretty text-[17px] leading-relaxed text-mist">{set.intro}</p>
                <RuleParts parts={set.parts} rules={set.key} labels={g.labels} captions={g.scenes} words={{ play: g.play, pause: g.pause, replay: g.replay }} />
              </section>
            ))}

            <section id="faq" aria-labelledby="faq-title" className="mt-20 scroll-mt-28">
              <h2 id="faq-title" className="font-display text-3xl font-bold tracking-tight text-cream">
                {g.faqTitle}
              </h2>
              <div className="mt-6 divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {g.faq.map((f, i) => (
                  <details key={i} className="group" open={i === 0}>
                    <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-left font-display text-lg font-semibold text-cream transition hover:text-gold-200">
                      <h3>{f.q}</h3>
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.05] ring-1 ring-white/10 transition duration-300 group-open:rotate-45 group-open:bg-gold-400/15 group-open:text-gold-300">
                        <Plus className="size-4" aria-hidden />
                      </span>
                    </summary>
                    <p className="max-w-3xl pb-6 pr-10 text-[15.5px] leading-relaxed text-mist">{f.a}</p>
                  </details>
                ))}
              </div>
              <p className="mt-8 text-[14px] text-fog">
                {g.source}{" "}
                <a href={pagePath(locale, "rating")} className="font-semibold text-gold-300 hover:text-gold-200">
                  {d.calc.shortTitle} →
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
      <DownloadCta locale={locale} text={g.cta} />
    </SiteFrame>
  );
}

function RuleParts({
  parts,
  rules,
  labels,
  captions,
  words,
}: {
  parts: GuidePart[];
  rules: "brazilian" | "official";
  labels: Parameters<typeof RuleScene>[0]["labels"];
  captions: Record<SceneKey, string>;
  words: { play: string; pause: string; replay: string };
}) {
  const sceneAt = (p: number, r: number) => SCENE_AT[rules].find((s) => s.at[0] === p && s.at[1] === r)?.scene;
  return (
    <>
      {parts.map((part, p) => (
        <Fragment key={part.id}>
          <h3 id={part.id} className="mt-12 scroll-mt-28 border-b border-white/[0.07] pb-3 font-display text-2xl font-bold tracking-tight text-gold-200">
            {part.title}
          </h3>
          <div className="mt-6 space-y-8">
            {part.rules.map((rule, r) => {
              const scene = sceneAt(p, r);
              return (
                <article
                  key={rule.id}
                  id={rule.id}
                  aria-labelledby={`${rule.id}-h`}
                  className={`scroll-mt-28 ${scene ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]" : ""}`}
                >
                  <div>
                    <h4 id={`${rule.id}-h`} className="font-display text-xl font-semibold text-cream">
                      {rule.title}
                    </h4>
                    <p className="mt-2 max-w-3xl text-pretty text-[16px] leading-[1.75] text-cream/80">{rule.text}</p>
                  </div>
                  {scene && (
                    <SceneFigure caption={captions[scene]} words={words}>
                      <RuleScene scene={scene} labels={labels} />
                    </SceneFigure>
                  )}
                </article>
              );
            })}
          </div>
        </Fragment>
      ))}
    </>
  );
}
