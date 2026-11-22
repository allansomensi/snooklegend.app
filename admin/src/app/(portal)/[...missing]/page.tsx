"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/providers/locale";
import { Card, Empty } from "@/components/ui/bits";

/** An address the portal doesn't have (inside the portal's frame). */
export default function Missing() {
  const { t } = useLocale();
  return (
    <Card>
      <Empty icon={Info} title={t("Nothing here")} text={t("That page doesn't exist.")} />
      <div className="row" style={{ justifyContent: "center", paddingBottom: 28 }}>
        <Link className="btn primary" href="/dashboard">{t("Dashboard")}</Link>
      </div>
    </Card>
  );
}
