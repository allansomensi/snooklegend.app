import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import es from "./es.json";
import ptBR from "./pt-BR.json";

/** Every source file of the portal. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !name.endsWith(".test.ts") ? [path] : [];
  });
}

/** The string literal that starts at `rest` ("…" or '…'), or null. */
function literal(rest: string): string | null {
  const quote = rest[0];
  if (quote !== '"' && quote !== "'") return null;
  let out = "";
  for (let k = 1; k < rest.length; k++) {
    const c = rest[k];
    if (c === "\\") out += rest[++k];
    else if (c === quote) return out;
    else out += c;
  }
  return null;
}

/** The texts the portal shows: the first argument of t(, tf( and msg(, and
 * the two of tn(n, "…", "…"). */
function texts(code: string): string[] {
  const found: string[] = [];
  for (const m of code.matchAll(/(?<![\w.$])(t|tf|msg)\(\s*/g)) {
    const s = literal(code.slice(m.index + m[0].length));
    if (s !== null) found.push(s);
  }
  for (const m of code.matchAll(/(?<![\w.$])tn\(/g)) {
    // tn(n, "one", "many"): the two literals after the first comma at depth 0.
    let k = m.index + m[0].length;
    let depth = 0;
    for (; k < code.length; k++) {
      const c = code[k];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      else if (c === "," && depth === 0) break;
    }
    let rest = code.slice(k + 1).trimStart();
    const one = literal(rest);
    if (one === null) continue;
    rest = rest.slice(rest.indexOf(rest[0], 1) + 1).replace(/^\s*,\s*/, "");
    const many = literal(rest);
    found.push(one);
    if (many !== null) found.push(many);
  }
  return found;
}

describe("the portal's words", () => {
  // The portal's code (src/admin) and its pages (src/app/admin).
  const all = [join(__dirname, ".."), join(__dirname, "../../app/admin")].flatMap(sources).flatMap((f) => texts(readFileSync(f, "utf8")));

  it("are found in the code", () => {
    expect(all.length).toBeGreaterThan(400);
  });

  it("all have their Portuguese and Spanish", () => {
    const missing = new Set<string>();
    for (const s of all) {
      for (const [lang, dict] of [["pt-BR", ptBR], ["es", es]] as const) {
        if (!(dict as Record<string, string>)[s]) missing.add(`${lang}: ${s}`);
      }
    }
    expect([...missing].sort()).toEqual([]);
  });

  it("keep the same placeholders in every language", () => {
    const wrong: string[] = [];
    const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    for (const dict of [ptBR, es] as Record<string, string>[]) {
      for (const [en, there] of Object.entries(dict)) {
        if (holes(en) !== holes(there)) wrong.push(`${en} → ${there}`);
      }
    }
    expect(wrong).toEqual([]);
  });
});
