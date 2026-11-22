"use client";

import { TriangleAlert, type LucideIcon } from "lucide-react";
import { Fragment, useId, useRef, useState, type ReactNode } from "react";
import { charCount } from "@/lib/format";
import { useLocale } from "../providers/locale";
import { Modal, type Tone } from "./modal";
import { Spinner } from "./bits";

export type FieldValue = string | boolean;
export type Values = Record<string, FieldValue>;

interface Base {
  name: string;
  label?: string;
  hint?: ReactNode;
  required?: boolean;
  optional?: boolean;
  /** The most characters (shows a counter). */
  max?: number;
  /** A problem with the value, or null. */
  validate?: (v: string, all: Values) => string | null;
}
export type Field =
  | (Base & { type?: "text" | "password" | "number"; placeholder?: string; autocomplete?: string; value?: string; min?: number; maxValue?: number; step?: number })
  | (Base & { type: "textarea"; rows?: number; placeholder?: string; value?: string })
  | (Base & { type: "select"; options: [string, string][]; value?: string })
  | (Base & { type: "choices"; options: [string, string][]; value?: string })
  | (Base & { type: "checkbox"; value?: boolean })
  /** Chips that fill the field `target` with their text. */
  | { type: "chips"; name: string; target: string; options: string[] }
  | { type: "node"; name: string; node: ReactNode | ((values: Values) => ReactNode) };

export interface FormDialogProps {
  title: string;
  text?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  wide?: boolean;
  fields: Field[];
  /** Shown under the fields, from the values (a preview). */
  extra?: (values: Values) => ReactNode;
  submit?: string;
  submitKind?: "primary" | "danger";
  /** Gets the values; throws to show an error (the window stays open). */
  onSubmit: (values: Values) => Promise<void>;
  onClose: () => void;
}

const initialValue = (f: Field): FieldValue => {
  if (f.type === "chips" || f.type === "node") return "";
  if (f.type === "checkbox") return !!f.value;
  if (f.type === "choices" || f.type === "select") return f.value ?? f.options[0]?.[0] ?? "";
  return f.value ?? "";
};

/** A form in a window. Enter sends it (Ctrl+Enter in a text area). */
export function FormDialog({ title, text, icon, tone, wide, fields, extra, submit, submitKind = "primary", onSubmit, onClose }: FormDialogProps) {
  const { t, tf, fmtNum } = useLocale();
  const uid = useId();
  const [values, setValues] = useState<Values>(() => Object.fromEntries(fields.map((f) => [f.name, initialValue(f)])));
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inputs = useRef<Record<string, HTMLElement | null>>({});
  const set = (name: string, v: FieldValue) => setValues((s) => ({ ...s, [name]: v }));

  async function run() {
    if (sending) return;
    setError(null);
    for (const f of fields) {
      if (f.type === "chips" || f.type === "node" || f.type === "checkbox") continue;
      const v = String(values[f.name] ?? "");
      let problem: string | null = null;
      if (f.required && !v.trim()) problem = tf("Fill in “{field}”.", { field: f.label || f.name });
      else if (f.max && charCount(v) > f.max) problem = tf("“{field}” is too long.", { field: f.label || f.name });
      else if (f.validate) problem = f.validate(v, values);
      if (problem) {
        setInvalid(f.name);
        setError(problem);
        inputs.current[f.name]?.focus();
        return;
      }
    }
    setInvalid(null);
    setSending(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSending(false);
    }
  }

  const fieldId = (name: string) => `${uid}-${name}`;
  const body = fields.map((f) => {
    if (f.type === "node") return <Fragment key={f.name}>{typeof f.node === "function" ? f.node(values) : f.node}</Fragment>;
    if (f.type === "chips") {
      return (
        <div key={f.name} className="chips">
          {f.options.map((label) => (
            <button
              key={label}
              type="button"
              className="chip"
              onClick={() => {
                set(f.target, label);
                inputs.current[f.target]?.focus();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      );
    }
    const id = fieldId(f.name);
    const v = values[f.name];
    const cls = (base: string) => base + (invalid === f.name ? " invalid" : "");
    const ref = (el: HTMLElement | null) => {
      inputs.current[f.name] = el;
    };
    if (f.type === "checkbox") {
      return (
        <label key={f.name} className="check" htmlFor={id}>
          <input id={id} type="checkbox" checked={!!v} onChange={(e) => set(f.name, e.target.checked)} />
          {f.label}
        </label>
      );
    }
    let input: ReactNode;
    if (f.type === "textarea") {
      input = (
        <textarea ref={ref} id={id} className={cls("textarea")} rows={f.rows || 3} placeholder={f.placeholder || ""}
          maxLength={f.max ? f.max * 2 : undefined} value={String(v)} onChange={(e) => set(f.name, e.target.value)} />
      );
    } else if (f.type === "select") {
      input = (
        <select ref={ref} id={id} className="select" value={String(v)} onChange={(e) => set(f.name, e.target.value)}>
          {f.options.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      );
    } else if (f.type === "choices") {
      input = (
        <div className="chips" role="radiogroup" aria-label={f.label}>
          {f.options.map(([val, label]) => (
            <button key={val} type="button" role="radio" aria-checked={String(v) === val} className={"chip" + (String(v) === val ? " on" : "")}
              onClick={() => set(f.name, val)}>
              {label}
            </button>
          ))}
        </div>
      );
    } else {
      input = (
        <input ref={ref} id={id} className={cls("input")} type={f.type || "text"} placeholder={f.placeholder || ""}
          autoComplete={f.autocomplete || "off"} min={f.min} max={f.type === "number" ? f.maxValue : undefined} step={f.step}
          value={String(v)} onChange={(e) => set(f.name, e.target.value)} />
      );
    }
    const n = f.max ? charCount(String(v)) : 0;
    return (
      <div key={f.name} className="field">
        {f.label ? (
          <label className="label" htmlFor={f.type === "choices" ? undefined : id}>
            <span>
              {f.label}
              {f.optional ? <span className="faint"> · {t("optional")}</span> : null}
            </span>
            {f.max ? <span className={"counter" + (n > f.max ? " over" : "")}>{fmtNum(n)} / {fmtNum(f.max)}</span> : null}
          </label>
        ) : null}
        {input}
        {f.hint ? <div className="hint">{f.hint}</div> : null}
      </div>
    );
  });

  return (
    <Modal
      title={title}
      text={text}
      icon={icon}
      tone={tone}
      wide={wide}
      onClose={onClose}
      onKeyDown={(e) => {
        const el = e.target as HTMLElement;
        const tag = el.tagName;
        if (e.key === "Enter" && ((tag === "INPUT" && (el as HTMLInputElement).type !== "checkbox") || (tag === "TEXTAREA" && (e.ctrlKey || e.metaKey)))) {
          e.preventDefault();
          void run();
        }
      }}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>{t("Cancel")}</button>
          <button type="button" data-primary className={"btn " + submitKind} disabled={sending} onClick={() => void run()}>
            {sending ? <Spinner /> : null}
            {submit || t("Save")}
          </button>
        </>
      }
    >
      {body}
      {extra ? extra(values) : null}
      {error ? (
        <div className="alert danger" role="alert">
          <TriangleAlert className="icon" aria-hidden />
          <div>{error}</div>
        </div>
      ) : null}
    </Modal>
  );
}
