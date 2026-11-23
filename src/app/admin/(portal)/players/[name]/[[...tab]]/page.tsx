"use client";

import { ChevronRight, Coins, Shield, Star, Target, Trophy, User } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { PlayerAchievements } from "@/admin/components/player/achievements";
import { PlayerComputer } from "@/admin/components/player/computer";
import { PlayerEconomy } from "@/admin/components/player/economy";
import { PlayerGames } from "@/admin/components/player/games";
import { PlayerHeader } from "@/admin/components/player/header";
import { PlayerModeration } from "@/admin/components/player/moderation";
import { PlayerOverview } from "@/admin/components/player/overview";
import { useLocale } from "@/admin/components/providers/locale";
import { Tabs, playerHref } from "@/admin/components/ui/bits";
import { Loaded } from "@/admin/components/ui/loaded";
import { msg } from "@/admin/i18n";
import { seg } from "@/admin/lib/api";
import { useApi } from "@/admin/lib/hooks";
import type { UserDetail } from "@/admin/lib/types";
import "@/admin/styles/players.css";

const TABS = [
  { id: "overview", label: msg("Overview"), icon: User },
  { id: "moderation", label: msg("Moderation"), icon: Shield },
  { id: "games", label: msg("Games"), icon: Trophy },
  { id: "computer", label: msg("Against the computer"), icon: Target },
  { id: "economy", label: msg("Economy"), icon: Coins },
  { id: "achievements", label: msg("Achievements"), icon: Star },
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
  const count = (id: TabId) =>
    id === "moderation" ? d.notes.length + d.reports.length : id === "games" ? d.history.length : id === "achievements" ? d.achievements.length : null;
  const Body = { overview: PlayerOverview, moderation: PlayerModeration, games: PlayerGames, computer: PlayerComputer, economy: PlayerEconomy, achievements: PlayerAchievements }[tab];
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
            alert: x.id === "moderation" && openReports > 0,
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
