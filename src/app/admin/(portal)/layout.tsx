"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useLocale } from "@/admin/components/providers/locale";
import { Shell } from "@/admin/components/shell/shell";
import { Btn, ErrorPage, PageLoading, Spinner } from "@/admin/components/ui/bits";
import { api, ApiError } from "@/admin/lib/api";
import { useSession } from "@/admin/lib/hooks";
import { session } from "@/admin/lib/session";
import type { Me } from "@/admin/lib/types";

/** The portal's pages: only for a staff member signed in. Without a session
 * they go to the sign-in page (and come back here after). */
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Boot />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

function Boot() {
  return (
    <div className="boot">
      <Spinner lg />
    </div>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const { token, me } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const client = useQueryClient();
  const { t } = useLocale();
  const [failure, setFailure] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) {
      // Nothing from the last session stays in memory.
      client.clear();
      const here = pathname + (search.size ? "?" + search.toString() : "");
      router.replace("/admin/login" + (here !== "/admin/dashboard" ? "?next=" + encodeURIComponent(here) : ""));
      return;
    }
    if (me) return;
    let live = true;
    api<Me>("/me")
      .then((m) => live && session.known(m))
      .catch((e) => {
        if (live && !(e instanceof ApiError && e.status === 401)) setFailure(e);
      });
    return () => {
      live = false;
    };
  }, [token, me, router, pathname, search, client, attempt]);

  if (failure) {
    return (
      <div className="login">
        <ErrorPage error={failure} onRetry={() => { setFailure(null); setAttempt((n) => n + 1); }} />
        <Btn label={t("Sign out")} kind="ghost" onClick={() => session.end(null)} />
      </div>
    );
  }
  if (!token || !me) return <Boot />;
  return (
    <Shell>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </Shell>
  );
}
