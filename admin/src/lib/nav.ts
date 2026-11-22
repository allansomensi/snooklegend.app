import {
  Activity, CalendarDays, ChartColumn, Coins, FileText, Flag, LayoutDashboard, Megaphone, MessageSquare, Server, Target, Users,
  type LucideIcon,
} from "lucide-react";
import { msg } from "@/i18n";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** g + this key goes there. */
  key: string;
  count?: "reports";
}
export type NavEntry = NavItem | { group: string };

export const NAV: NavEntry[] = [
  { group: msg("Overview") },
  { id: "dashboard", label: msg("Dashboard"), icon: LayoutDashboard, key: "d" },
  { id: "live", label: msg("Live"), icon: Activity, key: "l" },
  { group: msg("Moderation") },
  { id: "players", label: msg("Players"), icon: Users, key: "p" },
  { id: "reports", label: msg("Reports"), icon: Flag, key: "r", count: "reports" },
  { id: "chat", label: msg("Lounge chat"), icon: MessageSquare, key: "c" },
  { id: "fairplay", label: msg("Fair play"), icon: Target, key: "f" },
  { group: msg("Community") },
  { id: "community", label: msg("Board & announcements"), icon: Megaphone, key: "b" },
  { id: "events", label: msg("Events"), icon: CalendarDays, key: "v" },
  { group: msg("Business") },
  { id: "economy", label: msg("Economy"), icon: Coins, key: "e" },
  { id: "metrics", label: msg("Metrics"), icon: ChartColumn, key: "m" },
  { group: msg("Administration") },
  { id: "audit", label: msg("Audit log"), icon: FileText, key: "a" },
  { id: "system", label: msg("Server"), icon: Server, key: "s" },
];

export const NAV_ITEMS = NAV.filter((n): n is NavItem => "id" in n);

/** The section a path belongs to ("/players/ana" → "players"). */
export const sectionOf = (pathname: string) => pathname.split("/").filter(Boolean)[0] || "dashboard";
