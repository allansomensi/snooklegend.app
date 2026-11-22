// Which computer the visitor is on, so the big button downloads the right file.

export type OS = "windows" | "mac" | "linux" | "mobile" | "unknown";
export type Arch = "x64" | "arm64" | "unknown";
export type Platform = { os: OS; arch: Arch };

type UAData = {
  platform?: string;
  mobile?: boolean;
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }>;
};

export function detectOS(): OS {
  if (typeof navigator === "undefined") return "unknown";
  const uaData = (navigator as Navigator & { userAgentData?: UAData }).userAgentData;
  const ua = navigator.userAgent;
  const platform = (uaData?.platform || navigator.platform || "").toLowerCase();

  if (uaData?.mobile || /android|iphone|ipad|ipod|mobile/i.test(ua)) return "mobile";
  // iPadOS presents itself as a Mac with a touch screen.
  if (/mac/i.test(platform) && navigator.maxTouchPoints > 1) return "mobile";
  if (/win/.test(platform) || /windows/i.test(ua)) return "windows";
  if (/mac/.test(platform) || /mac os x|macintosh/i.test(ua)) return "mac";
  if (/cros/i.test(ua)) return "linux";
  if (/linux|x11|bsd/.test(platform) || /linux|x11/i.test(ua)) return "linux";
  return "unknown";
}

/** The processor, when the browser says (Chromium does; Safari and Firefox mostly don't). */
export async function detectArch(os: OS): Promise<Arch> {
  if (typeof navigator === "undefined") return "unknown";
  const uaData = (navigator as Navigator & { userAgentData?: UAData }).userAgentData;
  try {
    const v = await uaData?.getHighEntropyValues?.(["architecture", "bitness"]);
    if (v?.architecture === "arm") return "arm64";
    if (v?.architecture === "x86") return "x64";
  } catch {
    // Not allowed or not supported: guess below.
  }
  const ua = navigator.userAgent;
  if (/aarch64|arm64/i.test(ua)) return "arm64";
  if (/x86_64|x64|amd64|win64|wow64/i.test(ua)) return os === "mac" ? macFromGpu() : "x64";
  if (os === "mac") return macFromGpu();
  return "unknown";
}

/** Macs with Apple chips show an Apple GPU; Intel Macs show Intel or AMD. */
function macFromGpu(): Arch {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
    if (!gl) return "unknown";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(
      gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || "",
    ).toLowerCase();
    if (/apple m\d|apple gpu/.test(renderer)) return "arm64";
    if (/intel|amd|radeon|nvidia/.test(renderer)) return "x64";
  } catch {
    // Without WebGL there is nothing to go by.
  }
  return "unknown";
}
