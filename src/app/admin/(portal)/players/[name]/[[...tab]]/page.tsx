"use client";

import { Bell, ChevronRight, Coins, History, ListTree, Package, Shield, Star, Target, Timer, Trophy, User, Users } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { PlayerAchievements } from "@/admin/components/player/achievements";
import { PlayerChanges } from "@/admin/components/player/changes";
import { PlayerClock } from "@/admin/components/player/clock";
import { PlayerCollection } from "@/admin/components/player/collection";
import { PlayerComputer } from "@/admin/components/player/computer";
import { PlayerDoubles } from "@/admin/components/player/doubles";
import { PlayerEconomy } from "@/admin/components/player/economy";
import { PlayerGames } from "@/admin/components/player/games";
import { PlayerHeader } from "@/admin/components/player/header";
import { PlayerInbox } from "@/admin/components/player/inbox";
import { PlayerModeration } from "@/admin/components/player/moderation";
import { PlayerOverview } from "@/admin/components/player/overview";
import { PlayerTimeline } from "@/admin/components/player/timeline";
import { useLocale } from "@/admin/components/providers/locale";
import { Tabs, playerHref } from "@/admin/components/ui/bits";
import { Loaded } from "@/admin/components/ui/loaded";
import { msg } from "@/admin/i18n";
import { seg } from "@/admin/lib/api";
import { useApi } from "@/admin/lib/hooks";
import { parseDoublesRatings } from "@/admin/lib/modes";
import type { UserDetail } from "@/admin/lib/types";
import "@/admin/styles/players.css";

const TABS = [
  { id: "overview", label: msg("Overview"), icon: User },
  { id: "moderation", label: msg("Moderation"), icon: Shield },
  { id: "inbox", label: msg("Inbox"), icon: Bell },
  { id: "timeline", label: msg("Timeline"), icon: ListTree },
  { id: "games", label: msg("Games"), icon: Trophy },
  { id: "doubles", label: msg("Doubles"), icon: Users },
  { id: "clock", label: msg("Against the clock"), icon: Timer },
  { id: "computer", label: msg("Against the computer"), icon: Target },
  { id: "economy", label: msg("Economy"), icon: Coins },
  { id: "collection", label: msg("Collection"), icon: Package },
  { id: "achievements", label: msg("Achievements"), icon: Star },
  { id: "history", label: msg("Names & ratings"), icon: History },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function PlayerPage({ params }: { params: Promise<{ name: string; tab?: string[] }> }) {
  const { name: raw, tab: rest } = use(params);
  const name = decodeURIComponent(raw);
  const asked = rest?.[0] || "overview";
  const tab: TabId = TABS.some((x) => x.id === asked) ? (asked as TabId) : "overview";
  const detail = useApi<UserDetail>("/users/" + seg(name));
  const { t } = useLocale();
  return (
    <div>
      <nav className="crumbs" aria-label={t("Players")}>
        <Link href="/admin/players">{t("Players")}</Link>
        <ChevronRight className="icon" aria-hidden />
        <span aria-current="page">{detail.data?.user.username || name}</span>
      </nav>
      <Loaded queries={[detail]}>{(d) => <Player d={d} tab={tab} />}</Loaded>
    </div>
  );
}

function Player({ d, tab }: { d: UserDetail; tab: TabId }) {
  const { t } = useLocale();
  const u = d.user;
  const openReports = d.reports.filter((r) => r.status === 0).length;
  // Important notifications they haven't confirmed yet show on the tab.
  const waiting = (d.notifications || []).filter((n) => n.important && !n.read_at && !n.deleted_at).length;
  const doubles = parseDoublesRatings(d.doubles_ratings);
  const count = (id: TabId) =>
    id === "moderation" ? d.notes.length + d.reports.length
      : id === "games" ? d.history.length
        : id === "doubles" ? doubles.brazilian.games + doubles.official.games
        : id === "achievements" ? d.achievements.length
          : id === "inbox" ? waiting || null
            : id === "history" ? (d.renames?.length || 0) + (d.rating_adjustments?.length || 0) : null;
  const Body = {
    overview: PlayerOverview, moderation: PlayerModeration, inbox: PlayerInbox, timeline: PlayerTimeline, games: PlayerGames, doubles: PlayerDoubles, clock: PlayerClock, computer: PlayerComputer,
    economy: PlayerEconomy, collection: PlayerCollection, achievements: PlayerAchievements, history: PlayerChanges,
  }[tab];
  return (
    <>
      <PlayerHeader d={d} />
      <div className="section">
        <Tabs
          current={tab}
          items={TABS.map((x) => ({
            id: x.id,
            label: t(x.label),
            icon: x.icon,
            count: count(x.id) || null,
            alert: (x.id === "moderation" && openReports > 0) || (x.id === "inbox" && waiting > 0),
            href: playerHref(u.username, x.id),
          }))}
        />
        <div role="tabpanel">
          <Body d={d} />
        </div>
      </div>
    </>
  );
}
