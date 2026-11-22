"use client";

import { TriangleAlert, type LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Modal, type Tone } from "../ui/modal";
import { useLocale } from "./locale";

export interface ConfirmOptions {
  title: string;
  text?: string;
  confirm?: string;
  tone?: Tone;
  icon?: LucideIcon;
  details?: ReactNode;
}

interface Dialogs {
  /** Opens a window; `render` gets the function that closes it. */
  open: (render: (close: () => void) => ReactNode) => void;
  /** Asks first: true if the staff member confirmed. */
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  /** How many windows are open. */
  count: number;
}

const DialogContext = createContext<Dialogs | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<{ id: number; node: ReactNode }[]>([]);
  const next = useRef(0);

  const open = useCallback((render: (close: () => void) => ReactNode) => {
    const id = ++next.current;
    const close = () => setStack((s) => s.filter((d) => d.id !== id));
    setStack((s) => [...s, { id, node: render(close) }]);
  }, []);

  const confirm = useCallback(
    (o: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        open((close) => (
          <ConfirmDialog
            {...o}
            onAnswer={(yes) => {
              close();
              resolve(yes);
            }}
          />
        ));
      }),
    [open],
  );

  const value = useMemo(() => ({ open, confirm, count: stack.length }), [open, confirm, stack.length]);
  return (
    <DialogContext.Provider value={value}>
      {children}
      {stack.map((d) => (
        <DialogSlot key={d.id}>{d.node}</DialogSlot>
      ))}
    </DialogContext.Provider>
  );
}

function DialogSlot({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function ConfirmDialog({ title, text, confirm, tone = "danger", icon = TriangleAlert, details, onAnswer }: ConfirmOptions & { onAnswer: (yes: boolean) => void }) {
  const { t } = useLocale();
  const cancel = useRef<HTMLButtonElement>(null);
  const ok = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      title={title}
      text={text}
      icon={icon}
      tone={tone}
      onClose={() => onAnswer(false)}
      // For something that can't be taken back, Enter means "Cancel".
      initialFocus={tone === "danger" ? cancel : ok}
      footer={
        <>
          <button ref={cancel} type="button" className="btn" onClick={() => onAnswer(false)}>
            {t("Cancel")}
          </button>
          <button ref={ok} type="button" data-primary className={"btn " + (tone === "danger" ? "danger" : "primary")} onClick={() => onAnswer(true)}>
            {confirm || t("Confirm")}
          </button>
        </>
      }
    >
      {details}
    </Modal>
  );
}

export function useDialogs(): Dialogs {
  const c = useContext(DialogContext);
  if (!c) throw new Error("useDialogs outside DialogProvider");
  return c;
}
