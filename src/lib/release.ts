import { ASSETS, REPO } from "./site";

export type AssetInfo = { size: number; sha256?: string };

export type ReleaseInfo = {
  version: string;
  tag: string;
  date: string;
  url: string;
  assets: Record<string, AssetInfo>;
};

/** What the site shows when GitHub can't be reached while building. */
export const FALLBACK_RELEASE: ReleaseInfo = {
  version: "0.9.0",
  tag: "v0.9.0",
  date: "2026-11-22T00:18:25Z",
  url: `https://github.com/${REPO}/releases/tag/v0.9.0`,
  assets: {
    [ASSETS.winMsi]: { size: 17522688 },
    [ASSETS.winZip]: { size: 17111344 },
    [ASSETS.macArm]: { size: 11303700 },
    [ASSETS.macIntel]: { size: 11908576 },
    [ASSETS.linuxX64]: { size: 12053416 },
    [ASSETS.linuxArm]: { size: 11380104 },
    [ASSETS.installSh]: { size: 60569 },
    [ASSETS.installPs1]: { size: 22665 },
    [ASSETS.source]: { size: 35842171 },
  },
};

type GhAsset = { name: string; size: number; browser_download_url: string };
type GhRelease = { tag_name: string; name: string; published_at: string; html_url: string; assets: GhAsset[] };

let cached: Promise<ReleaseInfo> | null = null;

/** The latest release, read from GitHub once per build. */
export function getLatestRelease(): Promise<ReleaseInfo> {
  cached ??= fetchLatest().catch((err) => {
    console.warn(`[release] using the fallback release: ${err instanceof Error ? err.message : err}`);
    return FALLBACK_RELEASE;
  });
  return cached;
}

async function fetchLatest(): Promise<ReleaseInfo> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "snooklegend.app-build",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `https://api.github.com/repos/${REPO}/releases/latest`;
  let res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if ((res.status === 401 || res.status === 403) && headers.Authorization) {
    // A token that doesn't work here: the release is public, so ask without it.
    delete headers.Authorization;
    res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  }
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const rel = (await res.json()) as GhRelease;

  const assets: Record<string, AssetInfo> = {};
  for (const a of rel.assets) assets[a.name] = { size: a.size };

  // The checksums of every file, to show next to the downloads.
  const sums = rel.assets.find((a) => a.name === ASSETS.checksums);
  if (sums) {
    try {
      const text = await fetch(sums.browser_download_url, { signal: AbortSignal.timeout(15000) }).then((r) =>
        r.ok ? r.text() : "",
      );
      for (const line of text.split("\n")) {
        const m = line.trim().match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
        if (m && assets[m[2]]) assets[m[2]].sha256 = m[1].toLowerCase();
      }
    } catch {
      // The checksums are a nicety: the downloads work without them.
    }
  }

  return {
    version: rel.tag_name.replace(/^v/, ""),
    tag: rel.tag_name,
    date: rel.published_at,
    url: rel.html_url,
    assets,
  };
}

export function formatSize(bytes: number | undefined, locale: string): string {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString(locale)} KB`;
}
