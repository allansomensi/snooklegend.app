// The players who chose to appear on the supporters' page (VIP now or
// before): `GET /api/supporters`.

import { bool, getJson, isObj, num, str } from "./api";

export type Supporter = { username: string; country: string; since: number; months: number; vip: boolean };

export function parseSupporters(data: unknown): Supporter[] | null {
  if (!Array.isArray(data)) return null;
  return data
    .filter(isObj)
    .filter((s) => typeof s.username === "string" && s.username !== "")
    .map((s) => ({
      username: str(s.username),
      country: str(s.country).toUpperCase(),
      since: num(s.since),
      months: Math.max(0, num(s.months)),
      vip: bool(s.vip),
    }))
    // The longest-standing first, then by name.
    .sort((a, b) => b.months - a.months || a.since - b.since || a.username.localeCompare(b.username));
}

export function fetchSupporters() {
  return getJson("/api/supporters", parseSupporters);
}
