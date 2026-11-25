import {
  Activity, CalendarDays, CalendarRange, ChartColumn, ChartNoAxesCombined, Coins, Download, FileText, Flag, Gavel, Gift, LayoutDashboard, Megaphone,
  MessageSquare, Percent, Server, SlidersHorizontal, Target, Trophy, Users, Wrench, WholeWord, type LucideIcon,
} from "lucide-react";
import { msg } from "@/admin/i18n";
import type { Role } from "./types";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** g + this key goes there. */
  key: string;
  count?: "reports";
  /** Only administrators see it (moderators can't use it at all). */
  admin?: boolean;
}
export type NavEntry = NavItem | { group: string };

export const NAV: NavEntry[] = [
  { group: msg("Overview") },
  { id: "dashboard", label: msg("Dashboard"), icon: LayoutDashboard, key: "d" },
  { id: "live", label: msg("Live"), icon: Activity, key: "l" },
  { id: "calendar", label: msg("Calendar"), icon: CalendarRange, key: "k" },
  { group: msg("Moderation") },
  { id: "players", label: msg("Players"), icon: Users, key: "p" },
  { id: "reports", label: msg("Reports"), icon: Flag, key: "r", count: "reports" },
  { id: "chat", label: msg("Lounge chat"), icon: MessageSquare, key: "c" },
  { id: "words", label: msg("Banned words"), icon: WholeWord, key: "w" },
  { id: "fairplay", label: msg("Fair play"), icon: Target, key: "f" },
  { group: msg("Community") },
  { id: "community", label: msg("Board & announcements"), icon: Megaphone, key: "b" },
  { id: "events", label: msg("Events"), icon: CalendarDays, key: "v" },
  { id: "tournaments", label: msg("Official tournaments"), icon: Trophy, key: "t" },
  { group: msg("Business") },
  { id: "economy", label: msg("Economy"), icon: Coins, key: "e" },
  { id: "promotions", label: msg("Promotions"), icon: Percent, key: "o" },
  { id: "auctions", label: msg("Auctions"), icon: Gavel, key: "u" },
  { id: "gifts", label: msg("Presents to many"), icon: Gift, key: "i", admin: true },
  { id: "metrics", label: msg("Metrics"), icon: ChartColumn, key: "m" },
  { id: "analytics", label: msg("Analytics"), icon: ChartNoAxesCombined, key: "y" },
  { id: "exports", label: msg("Exports"), icon: Download, key: "x", admin: true },
  { group: msg("Administration") },
  { id: "settings", label: msg("Live settings"), icon: SlidersHorizontal, key: "n" },
  { id: "maintenance", label: msg("Maintenance"), icon: Wrench, key: "h" },
  { id: "audit", label: msg("Audit log"), icon: FileText, key: "a" },
  { id: "system", label: msg("Server"), icon: Server, key: "s" },
];

export const NAV_ITEMS = NAV.filter((n): n is NavItem => "id" in n);

/** The pages a role may open: moderators see every page but those only
 * administrators can use; a group left empty goes with them. */
export function navFor(role: Role | undefined): NavEntry[] {
  const admin = role === "admin";
  const shown = NAV.filter((n) => !("id" in n) || admin || !n.admin);
  return shown.filter((n, k) => "id" in n || (k + 1 < shown.length && "id" in shown[k + 1]));
}

export const navItemsFor = (role: Role | undefined) => navFor(role).filter((n): n is NavItem => "id" in n);

/** The section a path belongs to ("/admin/players/ana" → "players"). */
export const sectionOf = (pathname: string) => pathname.split("/").filter(Boolean)[1] || "dashboard";
