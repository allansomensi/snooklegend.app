"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { useRef, type ReactNode, type RefObject } from "react";
import { useLocale } from "../providers/locale";

export type Tone = "" | "danger" | "warning" | "info" | "success";

export interface ModalProps {
  title: string;
  text?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  wide?: boolean;
  onClose: () => void;
  footer?: ReactNode;
  children?: ReactNode;
  /** What gets the keyboard when the window opens (else the first field,
   * else the primary button). */
  initialFocus?: RefObject<HTMLElement | null>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

/** A window over the page: Esc, a click outside or × closes it, the
 * keyboard stays inside, and goes back where it was afterwards. */
export function Modal({ title, text, icon: Icon, tone = "", wide, onClose, footer, children, initialFocus, onKeyDown }: ModalProps) {
  const { t } = useLocale();
  const content = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-scrim">
          <Dialog.Content
            ref={content}
            className={"dialog" + (wide ? " wide" : "")}
            aria-describedby={undefined}
            onKeyDown={onKeyDown}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              const root = content.current;
              const first =
                initialFocus?.current ||
                root?.querySelector<HTMLElement>("input:not([type=checkbox]), textarea, select") ||
                root?.querySelector<HTMLElement>("[data-primary]") ||
                root?.querySelector<HTMLElement>("button");
              setTimeout(() => first?.focus(), 0);
            }}
          >
            <div className="dialog-head">
              {Icon ? (
                <div className={("dialog-icon " + tone).trim()}>
                  <Icon className="icon" aria-hidden />
                </div>
              ) : null}
              <div className="grow">
                <Dialog.Title asChild>
                  <h2>{title}</h2>
                </Dialog.Title>
                {text ? <p>{text}</p> : null}
              </div>
              <Dialog.Close className="btn ghost sm icon-only" aria-label={t("Close")}>
                <X className="icon" aria-hidden />
              </Dialog.Close>
            </div>
            <div className="dialog-body">{children}</div>
            {footer ? <div className="dialog-foot">{footer}</div> : null}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
