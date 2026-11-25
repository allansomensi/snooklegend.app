// The game's profile pictures, as the website shows them (public/avatars,
// copied from the game with scripts/sync-game-data.py; the order of
// `AVATARS` in the game's crates/proto/src/lib.rs).
import { AVATARS, RETIRED_AVATARS } from "@/lib/game-data";

/** The picture for an avatar code (a retired face as the picture that
 * replaced it), or null for none or a code this site doesn't know. */
export function avatarSrc(code?: string | null): string | null {
  if (!code) return null;
  const shown = RETIRED_AVATARS[code] ?? code;
  return AVATARS.includes(shown) ? `/avatars/${shown}.webp` : null;
}
