"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api } from "./api";
import { session, serverSession } from "./session";
import type { Me } from "./types";

/** Data from the staff API, kept under its path. */
export function useApi<T>(path: string, options: Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> = {}) {
  return useQuery<T>({ queryKey: [path], queryFn: ({ signal }) => api<T>(path, { signal }), ...options });
}

export function useSession() {
  return useSyncExternalStore(session.subscribe, session.get, serverSession);
}

/** The staff member signed in (the portal's pages only render once known). */
export function useMe(): Me {
  const me = useSession().me;
  if (!me) throw new Error("useMe before signing in");
  return me;
}

export function useIsAdmin() {
  return useSession().me?.role === "admin";
}

/** The page's query (?status=open…), and a way to change part of it
 * without adding to the history. */
export function useQueryParams() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = useCallback((k: string, fallback = "") => params.get(k) ?? fallback, [params]);
  const set = useCallback(
    (changes: Record<string, string | number | null | undefined>) => {
      const q = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === "" || v === null || v === undefined) q.delete(k);
        else q.set(k, String(v));
      }
      const s = q.toString();
      router.replace(pathname + (s ? "?" + s : ""), { scroll: false });
    },
    [params, router, pathname],
  );
  return { get, set };
}

/** A text field whose value goes to the address a moment after typing stops. */
export function useDebouncedParam(key: string, ms = 300) {
  const { get, set } = useQueryParams();
  const [value, setValue] = useState(get(key));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onChange = (v: string) => {
    setValue(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => set({ [key]: v.trim(), page: null }), ms);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return [value, onChange] as const;
}

/** A value that follows `value` once it stopped changing for `ms`. */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setV(value), ms);
    return () => clearTimeout(h);
  }, [value, ms]);
  return v;
}

/** Whether a media query matches now (a phone's width…), kept current. */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const m = matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => matchMedia(query).matches, () => false);
}

/** A phone's width: the portal's bar at the bottom, tables as cards (globals.css). */
export const PHONE = "(max-width: 640px)";
