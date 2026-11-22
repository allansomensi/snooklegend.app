"use client";

import { usePlatform } from "./PlatformProvider";

/** "v0.10.2": the release the download buttons offer (a new one may be out
 * since the site was built), else the one it was built with. */
export function LiveVersion({ built }: { built: string }) {
  const { release } = usePlatform();
  return <>v{release.version || built}</>;
}
