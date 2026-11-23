"use client";

import { useRouter } from "next/navigation";
import { Ban, Coins, Gift, Key, MicOff, Pencil, Shield, Star, StickyNote, TriangleAlert, Undo2, UserX } from "lucide-react";
import { msg } from "@/admin/i18n";
import { api, seg } from "@/admin/lib/api";
import { oneLine } from "@/admin/lib/format";
import type { CatalogItem, Economy, Payment, Role } from "@/admin/lib/types";
import { useRefresh } from "./providers";
import { useDialogs } from "./providers/dialogs";
import { useLocale } from "./providers/locale";
import { useToasts } from "./providers/toasts";
import { playerHref, useRoleLabel } from "./ui/bits";
import { FormDialog, type Field } from "./ui/form-dialog";

/** Who an action is about: an account, or just a name and whether they
 * are online (a line of the chat, a report). */
export interface Target {
  username: string;
  online?: boolean;
  role?: Role;
}

const REASONS = [msg("Cheating"), msg("Harassment or insults"), msg("Offensive name or status"), msg("Spam or flooding"), msg("Leaving games on purpose")];

export const CATEGORY: Record<string, string> = {
  cloth: msg("Cloth"), cue: msg("Cue"), chalk: msg("Chalk"), balls: msg("Balls"), frame: msg("Frame"), name: msg("Name colour"),
  effect: msg("Win effect"), table: msg("Table"), hall: msg("Hall"), avatar: msg("Picture"),
};

const post = (name: string, action: string, body: unknown) => api("/users/" + seg(name) + "/" + action, { method: "POST", body });

/** The actions on a player, each in its window. `after` runs once it worked
 * (else the page refreshes); mute and ban pass it how long, in words. */
export function usePlayerActions() {
  const { t, tf, tn, fmtMinutes } = useLocale();
  const dialogs = useDialogs();
  const { toast, attempt } = useToasts();
  const refresh = useRefresh();
  const router = useRouter();
  const roleLabel = useRoleLabel();
  const reasonChips = (target: string): Field => ({ type: "chips", name: "chips-" + target, target, options: REASONS.map((r) => t(r)) });
  const done = (after?: () => void) => (after ? after() : void refresh());

  return {
    /** A quick action without a window (unmute, clear the status…). */
    quick: async (u: Target, action: string, body: unknown, ok: string) => {
      const worked = await attempt(() => post(u.username, action, body), ok);
      if (worked) void refresh();
      return worked;
    },

    note(u: Target, kind: "note" | "warning", after?: () => void) {
      const warning = kind === "warning";
      dialogs.open((close) => (
        <FormDialog
          onClose={close}
          title={warning ? tf("Warn {name}", { name: u.username }) : tf("A staff note about {name}", { name: u.username })}
          text={warning ? (u.online ? t("They see it at once, on their screen.") : t("They see it when they next sign in.")) : t("Only the staff see notes. Keep them factual.")}
          icon={warning ? TriangleAlert : StickyNote}
          tone={warning ? "warning" : "info"}
          fields={[
            ...(warning ? [reasonChips("text")] : []),
            { name: "text", label: warning ? t("Warning") : t("Note"), type: "textarea", rows: 4, max: 600, required: true,
              placeholder: warning ? t("What they did, and what happens next time") : t("What happened, links, what to watch for") },
          ]}
          extra={warning ? (v) => (
            <div className="preview-box">
              <span className="faint">{t("The player reads (in their language)")}</span>
              {t("Warning from the staff:")} {oneLine(v.text) || "…"}
            </div>
          ) : undefined}
          submit={warning ? t("Send the warning") : t("Save the note")}
          onSubmit={async (v) => {
            await post(u.username, warning ? "warn" : "note", { reason: oneLine(v.text) });
            toast(warning ? t("Warning sent.") : t("Note saved."));
            done(after);
          }}
        />
      ));
    },

    mute(u: Target, after?: (time: string) => void) {
      dialogs.open((close) => (
        <FormDialog
          onClose={close}
          title={tf("Mute {name}", { name: u.username })}
          text={t("They can play but not write in the chat, nor post on the board.")}
          icon={MicOff}
          tone="warning"
          fields={[
            { name: "minutes", label: t("For how long"), type: "choices", value: "60", options: [15, 60, 1440, 10080, 43200].map((m) => [String(m), fmtMinutes(m)]) },
            reasonChips("reason"),
            { name: "reason", label: t("Reason (shown to the player)"), type: "textarea", rows: 2, max: 300, required: true, placeholder: t("Write the reason, or pick one above") },
          ]}
          submit={t("Mute")}
          submitKind="danger"
          onSubmit={async (v) => {
            const minutes = Number(v.minutes);
            await post(u.username, "mute", { minutes, reason: oneLine(v.reason) });
            toast(tf("{name} is muted for {time}.", { name: u.username, time: fmtMinutes(minutes) }));
            if (after) after(fmtMinutes(minutes));
            else void refresh();
          }}
        />
      ));
    },

    ban(u: Target, after?: (time: string) => void) {
      dialogs.open((close) => (
        <FormDialog
          onClose={close}
          title={tf("Ban {name}", { name: u.username })}
          text={t("They are signed out at once and can't sign in until the ban ends.")}
          icon={Ban}
          tone="danger"
          fields={[
            { name: "hours", label: t("For how long"), type: "choices", value: "72", options: [
              ["24", tn(1, "{n} day", "{n} days")], ["72", tn(3, "{n} day", "{n} days")], ["168", tn(1, "{n} week", "{n} weeks")],
              ["720", tn(30, "{n} day", "{n} days")], ["0", t("For good")],
            ] },
            reasonChips("reason"),
            { name: "reason", label: t("Reason (shown to the player)"), type: "textarea", rows: 2, max: 300, required: true, placeholder: t("Write the reason, or pick one above") },
          ]}
          extra={(v) => {
            const h = Number(v.hours);
            const reason = oneLine(v.reason) || "…";
            return (
              <div className="preview-box">
                <span className="faint">{t("The player reads")}</span>
                {h ? tf("Your account was suspended for {hours} hours: {reason}", { hours: h, reason }) : tf("Your account was banned: {reason}", { reason })}
              </div>
            );
          }}
          submit={t("Ban")}
          submitKind="danger"
          onSubmit={async (v) => {
            const hours = Number(v.hours);
            await post(u.username, "ban", { hours: hours || null, reason: oneLine(v.reason) });
            toast(tf("{name} is banned.", { name: u.username }));
            if (after) after(hours ? fmtMinutes(hours * 60) : t("for good"));
            else void refresh();
          }}
        />
      ));
    },

    unban(u: Target) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("Lift the ban on {name}?", { name: u.username })} text={t("They can sign in again at once.")} icon={Undo2} tone="info"
          fields={[{ name: "reason", label: t("Why"), optional: true, max: 300 }]}
          submit={t("Lift the ban")}
          onSubmit={async (v) => {
            await post(u.username, "unban", { reason: oneLine(v.reason) });
            toast(t("Ban lifted."));
            void refresh();
          }} />
      ));
    },

    kick(u: Target) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("Disconnect {name}?", { name: u.username })}
          text={t("Their connection ends now; they can come back at once. A game in progress waits for them.")} icon={UserX} tone="warning"
          fields={[{ name: "reason", label: t("Reason (shown to the player)"), optional: true, max: 300 }]}
          submit={t("Disconnect")} submitKind="danger"
          onSubmit={async (v) => {
            await post(u.username, "kick", { reason: oneLine(v.reason) });
            toast(t("Disconnected."));
            void refresh();
          }} />
      ));
    },

    rename(u: Target) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("Rename {name}", { name: u.username })} icon={Pencil}
          text={t("For a name that breaks the rules. It doesn't use one of the player's own changes; they are signed out and sign in again under the new name.")}
          fields={[
            { name: "name", label: t("New username"), required: true, hint: t("3 to 16 letters, digits or underscores."),
              validate: (v) => (/^[A-Za-z0-9_]{3,16}$/.test(v.trim()) ? null : t("Usernames have 3–16 letters, digits or underscores.")) },
            { name: "reason", label: t("Why"), optional: true, max: 300 },
          ]}
          submit={t("Rename")}
          onSubmit={async (v) => {
            const r = await post(u.username, "rename", { name: String(v.name).trim(), reason: oneLine(v.reason) }) as { user: { username: string } };
            toast(tf("Renamed to {name}.", { name: r.user.username }));
            router.replace(playerHref(r.user.username));
            void refresh();
          }} />
      ));
    },

    role(u: Target) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("The role of {name}", { name: u.username })} text={t("They are signed out so the new role takes effect.")} icon={Shield}
          fields={[
            { name: "role", label: t("Role"), type: "choices", value: u.role || "player",
              options: (["player", "moderator", "admin"] as const).map((r) => [r, roleLabel(r)]) },
            { type: "node", name: "roles-help", node: (
              <div className="hint stack">
                <span><b>{roleLabel("moderator")}: </b>{t("reports, warnings, mutes, bans, the chat and the board.")}</span>
                <span><b>{roleLabel("admin")}: </b>{t("everything, with roles, renames, passwords, coins and the server.")}</span>
              </div>
            ) },
          ]}
          onSubmit={async (v) => {
            await post(u.username, "role", { role: v.role });
            toast(t("Role changed."));
            void refresh();
          }} />
      ));
    },

    password(u: Target) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("A new password for {name}", { name: u.username })} icon={Key} tone="warning"
          text={t("Only after confirming who they are (their recovery e-mail). Every session of the account ends.")}
          fields={[
            { name: "password", label: t("New password"), type: "password", required: true, autocomplete: "new-password", hint: t("At least 8 characters, not only digits."),
              validate: (v) => (v.length < 8 || /^\d+$/.test(v) ? t("Passwords need at least 8 characters (not only digits).") : null) },
            { name: "again", label: t("The same again"), type: "password", required: true, autocomplete: "new-password",
              validate: (v, all) => (v !== all.password ? t("The passwords are not the same.") : null) },
          ]}
          submit={t("Set the password")} submitKind="danger"
          onSubmit={async (v) => {
            await post(u.username, "password", { password: v.password });
            toast(t("Password set. Tell the player through their recovery e-mail."));
            void refresh();
          }} />
      ));
    },

    coins(u: Target) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("Coins for {name}", { name: u.username })} icon={Coins}
          text={t("A negative amount takes coins away. Always with a reason: it goes to the audit log.")}
          fields={[
            { name: "coins", label: t("Coins"), type: "number", required: true, step: 1, placeholder: "500",
              validate: (v) => (!Number.isInteger(Number(v)) || Number(v) === 0 || Math.abs(Number(v)) > 1000000 ? t("A whole number, not zero, up to a million.") : null) },
            { name: "reason", label: t("Reason"), required: true, max: 300 },
          ]}
          submit={t("Apply")}
          onSubmit={async (v) => {
            await post(u.username, "coins", { coins: Number(v.coins), reason: oneLine(v.reason) });
            toast(t("Coins changed."));
            void refresh();
          }} />
      ));
    },

    async item(u: Target) {
      let items: CatalogItem[];
      try {
        items = (await api<Economy>("/economy")).catalog;
      } catch (e) {
        toast(e instanceof Error ? e.message : String(e), "error");
        return;
      }
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("An item for {name}", { name: u.username })} icon={Gift}
          fields={[
            { name: "item", label: t("Item"), type: "select", options: items.map((i) => [i.code, i.name + " · " + t(CATEGORY[i.category] || i.category) + " · " + i.code]) },
            { name: "reason", label: t("Reason"), required: true, max: 300 },
          ]}
          submit={t("Give")}
          onSubmit={async (v) => {
            await post(u.username, "item", { item: v.item, reason: oneLine(v.reason) });
            toast(t("Item given."));
            void refresh();
          }} />
      ));
    },

    vip(u: Target) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("VIP for {name}", { name: u.username })} text={t("Added to the VIP they have (or from today).")} icon={Star}
          fields={[
            { name: "days", label: t("Days"), type: "choices", value: "30", options: [7, 30, 90, 365].map((d) => [String(d), tn(d, "{n} day", "{n} days")]) },
            { name: "reason", label: t("Reason"), required: true, max: 300 },
          ]}
          submit={t("Give")}
          onSubmit={async (v) => {
            await post(u.username, "vip", { days: Number(v.days), reason: oneLine(v.reason) });
            toast(t("VIP given."));
            void refresh();
          }} />
      ));
    },

    revoke(u: Target, code: string) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("Take {item} back from {name}?", { item: code, name: u.username })} icon={Gift} tone="danger"
          text={t("For an item given by mistake, or a refunded purchase. They stop using it at once.")}
          fields={[{ name: "reason", label: t("Reason"), required: true, max: 300 }]}
          submit={t("Take back")} submitKind="danger"
          onSubmit={async (v) => {
            await post(u.username, "revoke", { item: code, reason: oneLine(v.reason) });
            toast(t("Item taken back."));
            void refresh();
          }} />
      ));
    },

    /** Marks a payment as a test (left out of the revenue), or as real. */
    async markPayment(p: Payment) {
      const ok = await dialogs.confirm({
        title: p.test ? t("Count this payment as real money?") : t("Mark this payment as a test?"),
        text: t("Test payments (the provider's test keys) stay out of the revenue."),
        confirm: p.test ? t("Mark as real") : t("Mark as test"),
        tone: "warning",
        icon: Coins,
      });
      if (ok && (await attempt(() => api("/payments/" + seg(p.id) + "/test", { method: "POST", body: { test: !p.test } }), t("Saved.")))) void refresh();
    },
  };
}
