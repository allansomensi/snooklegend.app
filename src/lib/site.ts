// Everything the site links to, in one place.

export const SITE_URL = "https://snooklegend.app";
export const SITE_NAME = "Snook Legend";

/**
 * The game's official profiles: linked from every page's footer (with
 * `rel="me"`) and named in the structured data (`sameAs`). Adding one is one
 * line here (and its icon in `components/icons.tsx`); an entry whose `url` is
 * still empty is left out everywhere.
 */
export const SOCIAL_PROFILES: readonly { key: "bluesky" | "instagram" | "facebook" | "x" | "threads"; name: string; url: string }[] = [
  { key: "bluesky", name: "Bluesky", url: "https://bsky.app/profile/snooklegend.app" },
  { key: "instagram", name: "Instagram", url: "https://www.instagram.com/snooklegend.app/" },
  { key: "facebook", name: "Facebook", url: "https://www.facebook.com/snooklegend" },
  { key: "x", name: "X", url: "https://x.com/snooklegend_app" },
  { key: "threads", name: "Threads", url: "https://www.threads.com/@snooklegend.app" },
];

/** The game's account on X, for the cards shared there (`twitter:site`, `twitter:creator`). */
export const X_HANDLE = "@snooklegend_app";

/** The official profiles that have an address. */
export const socialProfiles = () => SOCIAL_PROFILES.filter((p) => p.url !== "");

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

/** The game in the Microsoft Store (`NEXT_PUBLIC_MS_STORE_URL` replaces it when building). */
export const MS_STORE_URL = process.env.NEXT_PUBLIC_MS_STORE_URL || "https://apps.microsoft.com/detail/9NZ15BNMZPTG";

/** The game's page on itch.io. */
export const ITCH_URL = "https://allansomensi.itch.io/snook-legend";

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
