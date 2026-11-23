/** The game server's address (its staff API is under `/admin/api`). */
export function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7878";
  return raw.trim().replace(/\/+$/, "");
}

/** The game server's origin, for the Content Security Policy. */
export function apiOrigin(): string {
  try {
    return new URL(apiBase()).origin;
  } catch {
    return "'none'";
  }
}
