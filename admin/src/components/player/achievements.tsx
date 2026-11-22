"use client";

import { Star } from "lucide-react";
import type { UserDetail } from "@/lib/types";
import { useLocale } from "../providers/locale";
import { Card, CardHead, Empty } from "../ui/bits";

export function PlayerAchievements({ d }: { d: UserDetail }) {
  const { t, tn, fmtDate, fmtDateOnly } = useLocale();
  if (!d.achievements.length) {
    return (
      <Card>
        <Empty icon={Star} title={t("No achievements yet")} />
      </Card>
    );
  }
  return (
    <Card>
      <CardHead title={t("Achievements")} sub={tn(d.achievements.length, "{n} unlocked", "{n} unlocked")} />
      <ul className="card-body item-chips">
        {d.achievements.map(([code, at]) => (
          <li key={code} className="item-chip plain" title={fmtDate(at)}>
            <Star className="icon" aria-hidden />
            <span className="mono">{code}</span>
            <span className="faint">{fmtDateOnly(at)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
