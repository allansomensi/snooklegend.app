import { readFileSync } from "node:fs";
import path from "node:path";
import { LOCALE_INFO, type Locale } from "@/i18n";
import { GITHUB_URL, ISSUES_URL, type LegalDoc } from "./site";

/** When each text last changed (shown at its top): change it with the text. */
export const LEGAL_UPDATED: Record<LegalDoc, string> = {
  privacy: "2026-11-27",
  terms: "2026-11-26",
};

/**
 * Who provides the game, as the pages name them, from the build's environment
 * (in Vercel: the project → Settings → Environment Variables):
 *
 * | Variable           | What                                                          |
 * |--------------------|---------------------------------------------------------------|
 * | `LEGAL_CONTROLLER` | the person or company who provides the game and controls data |
 * | `LEGAL_DOCUMENT`   | their CPF or CNPJ (left out when empty)                       |
 * | `LEGAL_ADDRESS`    | their address (left out when empty)                           |
 * | `LEGAL_CONTACT`    | e-mail or web address for support, refunds and privacy        |
 *
 * Brazilian law on online sales (Decreto 7.962/2013, art. 2) asks a seller to
 * show their name, CPF or CNPJ, address and an electronic contact: set them
 * all while the game sells anything.
 */
export function legalInfo() {
  const env = (name: string) => process.env[name]?.trim() || "";
  return {
    game: "Snook Legend",
    controller: env("LEGAL_CONTROLLER") || "Allan Somensi",
    document: env("LEGAL_DOCUMENT"),
    address: env("LEGAL_ADDRESS"),
    contact: env("LEGAL_CONTACT") || ISSUES_URL,
  };
}

function escape(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** A contact as a link: `mailto:` for an e-mail address, the address for a web one. */
function link(contact: string): string {
  const c = contact.trim();
  let href: string;
  if (c.includes("@") && !c.includes("://") && !/\s/.test(c)) href = `mailto:${c}`;
  else if (/^https?:\/\//.test(c)) href = c;
  else return escape(c);
  return `<a href="${escape(href)}">${escape(c)}</a>`;
}

/** Leaves out what lies between `<!--?KEY-->` and `<!--/KEY-->` when KEY is empty. */
function optionalBlocks(html: string, values: Record<string, string>): string {
  return html.replace(/<!--\?(\w+)-->([\s\S]*?)<!--\/\1-->/g, (_, key: string, inner: string) =>
    values[key]?.trim() ? inner : "",
  );
}

/** The text of `doc` in `locale`, filled in (HTML, for the page's article). */
export function legalHtml(doc: LegalDoc, locale: Locale): string {
  const file = path.join(process.cwd(), "src", "content", "legal", `${doc}.${locale}.html`);
  const info = legalInfo();
  const updated = new Intl.DateTimeFormat(LOCALE_INFO[locale].htmlLang, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${LEGAL_UPDATED[doc]}T12:00:00Z`));
  const values: Record<string, string> = {
    GAME: escape(info.game),
    CONTROLLER: escape(info.controller),
    DOCUMENT: escape(info.document),
    ADDRESS: escape(info.address),
    CONTACT: link(info.contact),
    REPO: link(GITHUB_URL),
    UPDATED: escape(updated),
  };
  const html = optionalBlocks(readFileSync(file, "utf8"), { DOCUMENT: info.document, ADDRESS: info.address })
    // The note at the top of the file is for whoever edits it.
    .replace(/^<!--[\s\S]*?-->\s*/, "");
  return html.replace(/\{\{([A-Z]+)\}\}/g, (whole, key: string) => values[key] ?? whole);
}
