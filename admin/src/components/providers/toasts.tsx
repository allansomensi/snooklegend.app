"use client";

import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale } from "./locale";

export type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
  out: boolean;
}

interface Toasts {
  toast: (text: string, kind?: ToastKind) => void;
  /** Runs an action: a toast for its outcome, true if it worked. */
  attempt: (fn: () => Promise<unknown>, done?: string) => Promise<boolean>;
}

const ToastContext = createContext<Toasts | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const [list, setList] = useState<Toast[]>([]);
  const next = useRef(0);

  const remove = useCallback((id: number) => {
    setList((l) => l.map((x) => (x.id === id ? { ...x, out: true } : x)));
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 200);
  }, []);

  const toast = useCallback(
    (text: string, kind: ToastKind = "success") => {
      const id = ++next.current;
      setList((l) => [...l, { id, text, kind, out: false }].slice(-4));
      setTimeout(() => remove(id), kind === "error" ? 7000 : 4200);
    },
    [remove],
  );

  const attempt = useCallback(
    async (fn: () => Promise<unknown>, done?: string) => {
      try {
        await fn();
        if (done) toast(done, "success");
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
        return false;
      }
    },
    [toast],
  );

  const value = useMemo(() => ({ toast, attempt }), [toast, attempt]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {list.map((x) => {
          const Icon = x.kind === "error" ? TriangleAlert : x.kind === "info" ? Info : CircleCheck;
          return (
            <div key={x.id} className={`toast ${x.kind}${x.out ? " out" : ""}`} role={x.kind === "error" ? "alert" : "status"}>
              <Icon className="icon" aria-hidden />
              <div className="toast-text">{x.text}</div>
              <button type="button" className="btn ghost sm icon-only" aria-label={t("Close")} onClick={() => remove(x.id)}>
                <X className="icon" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts(): Toasts {
  const c = useContext(ToastContext);
  if (!c) throw new Error("useToasts outside ToastProvider");
  return c;
}
