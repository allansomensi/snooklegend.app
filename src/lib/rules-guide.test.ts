import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n";
import { RULES } from "./ranking";
import { parseRules, readRules, slugify } from "./rules-guide";

describe("rules guide", () => {
  it("reads parts and rules, leaving the comments out", () => {
    const parts = parseRules("# a comment\n\n## The game\n\n### The aim\nPocket them.\nAll.\n\n### Turn\nYours.\n## Fouls\n### Turn\nx", "br");
    expect(parts).toEqual([
      {
        id: "br-the-game",
        title: "The game",
        rules: [
          { id: "br-the-aim", title: "The aim", text: "Pocket them. All." },
          { id: "br-turn", title: "Turn", text: "Yours." },
        ],
      },
      { id: "br-fouls", title: "Fouls", rules: [{ id: "br-turn-2", title: "Turn", text: "x" }] },
    ]);
    expect(slugify("A saída: só a branca!")).toBe("a-saida-so-a-branca");
  });

  it("has the same parts and rules in every language", () => {
    for (const rules of RULES) {
      const shape = (l: (typeof LOCALES)[number]) => readRules(rules, l).map((p) => p.rules.length);
      for (const l of LOCALES) {
        expect(shape(l)).toEqual(shape("en"));
        expect(readRules(rules, l).every((p) => p.rules.every((r) => r.text.length > 20))).toBe(true);
      }
    }
    expect(readRules("brazilian", "en").map((p) => p.rules.length)).toEqual([3, 6, 7, 2]);
    expect(readRules("official", "en").map((p) => p.rules.length)).toEqual([3, 5, 4, 3, 2]);
  });
});
