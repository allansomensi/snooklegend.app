"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

const ReplayViewer = dynamic(() => import("../viewer/replay-viewer"), { ssr: false });

interface Viewer {
  /** Opens a game in the replay viewer (`/replay/7/view`, `/live/3/view`);
   * `fallback` is tried when `path` has no such game (a number typed in
   * the search may be a live room). */
  open: (path: string, fallback?: string) => void;
  close: () => void;
  isOpen: boolean;
}

const ViewerContext = createContext<Viewer | null>(null);

export function ViewerProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<{ path: string; fallback?: string; key: number } | null>(null);
  const open = useCallback((path: string, fallback?: string) => setGame((g) => ({ path, fallback, key: (g?.key || 0) + 1 })), []);
  const close = useCallback(() => setGame(null), []);
  const value = useMemo(() => ({ open, close, isOpen: !!game }), [open, close, game]);
  return (
    <ViewerContext.Provider value={value}>
      {children}
      {game ? <ReplayViewer key={game.key} path={game.path} fallback={game.fallback} onClose={close} /> : null}
    </ViewerContext.Provider>
  );
}

export function useViewer(): Viewer {
  const c = useContext(ViewerContext);
  if (!c) throw new Error("useViewer outside ViewerProvider");
  return c;
}
