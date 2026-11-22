// Everything the site links to, in one place.

export const SITE_URL = "https://snooklegend.app";

export const REPO = "allansomensi/snook-legend";
export const GITHUB_URL = `https://github.com/${REPO}`;
export const RELEASES_URL = `${GITHUB_URL}/releases`;
export const LATEST_RELEASE_URL = `${GITHUB_URL}/releases/latest`;
export const CHANGELOG_URL = `${GITHUB_URL}/blob/main/CHANGELOG.md`;
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;
export const ISSUES_URL = `${GITHUB_URL}/issues`;
export const TRANSLATIONS_URL = `${GITHUB_URL}/tree/main/crates/client/lang`;

/** A file of the latest release: GitHub always redirects to the newest version. */
export const latestAsset = (name: string) => `${GITHUB_URL}/releases/latest/download/${name}`;

/**
 * The game in the Microsoft Store. Replace the search with the product page
 * (https://apps.microsoft.com/detail/<product id>) once it is at hand.
 */
export const MS_STORE_URL =
  process.env.NEXT_PUBLIC_MS_STORE_URL || "https://apps.microsoft.com/search?query=Snook%20Legend";

/** The legal pages: the privacy policy and the terms of use. */
export const LEGAL_DOCS = ["privacy", "terms"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

/**
 * Their address in each language (`/privacy/`, `/pt/privacidade/`, `/es/terminos/`…).
 * The game and its server link to these: change them only with redirects.
 */
export const LEGAL_SLUGS = {
  en: { privacy: "privacy", terms: "terms" },
  pt: { privacy: "privacidade", terms: "termos" },
  es: { privacy: "privacidad", terms: "terminos" },
} as const satisfies Record<"en" | "pt" | "es", Record<LegalDoc, string>>;

export function legalPath(locale: keyof typeof LEGAL_SLUGS, doc: LegalDoc): string {
  const base = locale === "en" ? "/" : `/${locale}/`;
  return `${base}${LEGAL_SLUGS[locale][doc]}/`;
}

export const ASSETS = {
  winMsi: "snook-legend-x86_64-pc-windows-msvc.msi",
  winZip: "snook-legend-x86_64-pc-windows-msvc.zip",
  macArm: "snook-legend-aarch64-apple-darwin.tar.xz",
  macIntel: "snook-legend-x86_64-apple-darwin.tar.xz",
  linuxX64: "snook-legend-x86_64-unknown-linux-gnu.tar.xz",
  linuxArm: "snook-legend-aarch64-unknown-linux-gnu.tar.xz",
  installSh: "snook-legend-installer.sh",
  installPs1: "snook-legend-installer.ps1",
  checksums: "sha256.sum",
  source: "source.tar.gz",
} as const;

export type AssetKey = keyof typeof ASSETS;

export const INSTALL_SH = `curl --proto '=https' --tlsv1.2 -LsSf ${latestAsset(ASSETS.installSh)} | sh`;
export const INSTALL_PS1 = `powershell -ExecutionPolicy Bypass -c "irm ${latestAsset(ASSETS.installPs1)} | iex"`;
