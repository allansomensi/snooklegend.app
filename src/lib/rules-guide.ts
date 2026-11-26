// The rules guide's text: the rules exactly as the game shows them
// (src/content/rules, copied from the game by scripts/sync-game-data.py).
// "## <part>" starts a part, "### <title>" a rule; the same parts and rules,
// in the same order, in every language.

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Locale } from "@/i18n";
import type { Rules } from "./ranking";

/**
 * When the rules' text (src/content/rules) last changed: the guide's date
 * for search engines. Change it with the text.
 */
export const RULES_UPDATED = "2026-11-25";

export type GuideRule = { id: string; title: string; text: string };
export type GuidePart = { id: string; title: string; rules: GuideRule[] };

/** An anchor from a title: "A saída" → "a-saida". */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The parts and rules of a rules file (comments, `#` lines, left out). */
export function parseRules(md: string, prefix: string): GuidePart[] {
  const parts: GuidePart[] = [];
  const used = new Set<string>();
  const unique = (base: string) => {
    let id = `${prefix}-${base}`;
    for (let k = 2; used.has(id); k++) id = `${prefix}-${base}-${k}`;
    used.add(id);
    return id;
  };
  for (const line of md.split("\n")) {
    const l = line.trimEnd();
    if (l.startsWith("### ")) {
      const title = l.slice(4).trim();
      parts.at(-1)?.rules.push({ id: unique(slugify(title)), title, text: "" });
    } else if (l.startsWith("## ")) {
      const title = l.slice(3).trim();
      parts.push({ id: unique(slugify(title)), title, rules: [] });
    } else if (l.startsWith("#") || l === "") {
      continue;
    } else {
      const rule = parts.at(-1)?.rules.at(-1);
      if (rule) rule.text = rule.text ? `${rule.text} ${l.trim()}` : l.trim();
    }
  }
  return parts;
}

export function readRules(rules: Rules, locale: Locale): GuidePart[] {
  const file = path.join(process.cwd(), "src", "content", "rules", `${rules}.${locale}.md`);
  return parseRules(readFileSync(file, "utf8"), rules === "brazilian" ? "br" : "wpa");
}
