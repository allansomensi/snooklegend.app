"use client";

import { useRouter } from "next/navigation";
import { Ban, Coins, Gift, Key, Mail, MicOff, Pencil, Scale, Shield, Square, Star, StickyNote, TriangleAlert, Undo2, UserX } from "lucide-react";
import { msg } from "@/admin/i18n";
import { api, seg } from "@/admin/lib/api";
import { fromLocalInput, toLocalInput } from "@/admin/components/events/event-words";
import { oneLine, nowSecs } from "@/admin/lib/format";
import { MAX_MUTE_MINUTES, minutesUntil, parsePreview, ratingChange } from "@/admin/lib/inbox";
import { RULES, recordOf } from "@/admin/lib/rules";
import type { CatalogItem, Economy, GameRow, Payment, Preview, Records, Role, RulesId } from "@/admin/lib/types";
import { CATEGORY, ItemPicker, fromCatalog } from "./items";
import { useRefresh } from "./providers";
import { useDialogs } from "./providers/dialogs";
import { useLocale } from "./providers/locale";
import { useToasts } from "./providers/toasts";
import { playerHref, useRoleLabel, useRulesNames } from "./ui/bits";
import { FormDialog, type Field } from "./ui/form-dialog";

export { CATEGORY };

/** Who an action is about: an account, or just a name and whether they
 * are online (a line of the chat, a report). */
export interface Target {
  username: string;
  online?: boolean;
  role?: Role;
}

const REASONS = [msg("Cheating"), msg("Harassment or insults"), msg("Offensive name or status"), msg("Spam or flooding"), msg("Leaving games on purpose")];

const post = (name: string, action: string, body: unknown) => api("/users/" + seg(name) + "/" + action, { method: "POST", body });

/** What a call would tell the player (`"preview": true`), or null. */
export const previewCall = async (path: string, body: Record<string, unknown>): Promise<Preview | null> =>
  parsePreview(await api(path, { method: "POST", body: { ...body, preview: true } }));
const previewAction = (name: string, action: string, body: Record<string, unknown>) => previewCall("/users/" + seg(name) + "/" + action, body);

/** Items the staff may give: sold for coins, a pack's, or only won. */
export const GIVABLE = (i: CatalogItem) => i.how === "coins" || i.how === "pack" || i.how === "earned";

/** A stored game that may be annulled. */
export interface VoidTarget {
  id: number;
  names: [string, string];
}

/** A live game that may be ended. */
export interface LiveTarget {
  id: number;
  players: [string, string];
}

/** The actions on a player, each in its window. `after` runs once it worked
 * (else the page refreshes); mute and ban pass it how long, in words. */
export function usePlayerActions() {
  const { t, tf, tn, fmtNum, fmtDate, fmtMinutes } = useLocale();
  const { rulesName } = useRulesNames();
  const dialogs = useDialogs();
  const { toast, attempt } = useToasts();
  const refresh = useRefresh();
  const router = useRouter();
  const roleLabel = useRoleLabel();
  const reasonChips = (target: string): Field => ({ type: "chips", name: "chips-" + target, target, options: REASONS.map((r) => t(r)) });
  /** A mute's minutes: a choice, or until a time. */
  const muteMinutes = (choice: unknown, until: unknown) =>
    choice === "until" ? Math.min(MAX_MUTE_MINUTES, minutesUntil(fromLocalInput(String(until)), nowSecs())) : Number(choice);
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
          preview={warning ? (v) => previewAction(u.username, "warn", { reason: oneLine(v.text) }) : undefined}
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
            { name: "minutes", label: t("For how long"), type: "choices", value: "60",
              options: [...[15, 60, 1440, 10080, 43200].map((m) => [String(m), fmtMinutes(m)] as [string, string]), ["until", t("Until…")]] },
            { name: "until", type: "custom", value: toLocalInput(nowSecs() + 86400), label: t("Muted until"),
              render: (value, set, all) => all.minutes === "until" ? (
                <input className="input" type="datetime-local" aria-label={t("Muted until")} value={String(value)} onChange={(e) => set(e.target.value)} />
              ) : <span className="hint">{tf("Until {when}", { when: fmtDate(nowSecs() + Number(all.minutes) * 60) })}</span>,
              validate: (value, all) => {
                if (all.minutes !== "until") return null;
                const at = fromLocalInput(value);
                if (!Number.isFinite(at) || at <= nowSecs()) return t("Choose a time in the future.");
                return at - nowSecs() > MAX_MUTE_MINUTES * 60 ? t("A mute lasts 30 days at most.") : null;
              } },
            reasonChips("reason"),
            { name: "reason", label: t("Reason (shown to the player)"), type: "textarea", rows: 2, max: 300, required: true, placeholder: t("Write the reason, or pick one above") },
          ]}
          preview={(v) => previewAction(u.username, "mute", { minutes: muteMinutes(v.minutes, v.until), reason: oneLine(v.reason) })}
          submit={t("Mute")}
          submitKind="danger"
          onSubmit={async (v) => {
            const minutes = muteMinutes(v.minutes, v.until);
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
            { name: "reason", label: t("Reason (shown to the player)"), required: true, max: 300 },
          ]}
          preview={(v) => (Number(v.coins) > 0 ? previewAction(u.username, "coins", { coins: Number(v.coins), reason: oneLine(v.reason) }) : Promise.resolve(null))}
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
      const givable = items.filter(GIVABLE).map(fromCatalog);
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("An item for {name}", { name: u.username })} icon={Gift} wide
          text={t("Items sold for coins, a pack's, or only won (event and season prizes). The reason is shown under the item in their collection.")}
          fields={[
            { name: "item", label: t("Item"), type: "custom", required: true,
              render: (value, set) => <ItemPicker label={t("Item")} items={givable} value={String(value)} onChange={(x) => set(String(x))} height={240} /> },
            { name: "reason", label: t("Reason (shown to the player)"), required: true, max: 300, placeholder: t("Christmas 2026 winner") },
          ]}
          preview={(v) => previewAction(u.username, "item", { item: v.item, reason: oneLine(v.reason) })}
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
            { name: "reason", label: t("Reason (shown to the player)"), required: true, max: 300 },
          ]}
          preview={(v) => previewAction(u.username, "vip", { days: Number(v.days), reason: oneLine(v.reason) })}
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

    /** A message from the staff in the player's inbox (staff; moderators
     * not to staff). */
    message(u: Target, after?: () => void) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("A message to {name}", { name: u.username })} icon={Mail} wide
          text={t("It goes to their inbox in the game, signed with your name, as you write it (in one language). You see when they read it.")}
          fields={[
            { name: "text", label: t("Message"), type: "textarea", rows: 5, max: 1000, required: true, placeholder: t("Please change your status.") },
            { name: "important", label: t("Important: they must confirm they read it (it pops up until they do)"), type: "checkbox" },
            { name: "pinned", label: t("Pinned at the top of their inbox"), type: "choices", value: "0",
              options: [["0", t("Not pinned")], ...[1, 3, 7, 30].map((d) => [String(d), tn(d, "{n} day", "{n} days")] as [string, string])] },
          ]}
          preview={(v) => previewAction(u.username, "message", { text: String(v.text).trim(), important: !!v.important, pinned_days: Number(v.pinned) })}
          submit={t("Send the message")}
          onSubmit={async (v) => {
            await post(u.username, "message", { text: String(v.text).trim(), important: !!v.important, pinned_days: Number(v.pinned) });
            toast(t("Message sent."));
            done(after);
          }} />
      ));
    },

    /** Puts a player's rating right (administrators): points to add or
     * take, or the rating to put, with a reason and maybe the game. */
    rating(u: Target & { records?: Records }, games: GameRow[] = [], game?: { id: number; rules: RulesId }) {
      const current = (r: string) => recordOf(u, r as RulesId).rating;
      const check = (all: Record<string, unknown>) => ratingChange(current(String(all.rules)), all.mode as "delta" | "rating", String(all.value ?? ""));
      const body = (v: Record<string, unknown>) => {
        const c = check(v);
        const n = "delta" in c ? c.delta : 0;
        return {
          rules: v.rules, reason: oneLine(v.reason), ...(v.mode === "delta" ? { delta: n } : { rating: Number(v.value) }),
          ...(v.match ? { match_id: Number(v.match) } : {}),
        };
      };
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("Adjust the rating of {name}", { name: u.username })} icon={Scale} tone="warning" wide
          text={t("For a rating farmed or lost unfairly. The peak follows; their rating chart shows the change; they are told why, with the game to watch.")}
          fields={[
            { name: "rules", label: t("Rules"), type: "choices", value: game?.rules || "brazilian", options: RULES.map((r) => [r, rulesName(r)]) },
            { name: "mode", label: t("Change"), type: "choices", value: "delta", options: [["delta", t("Add or take points")], ["rating", t("Put a rating")]] },
            { name: "value", label: t("Points (negative to take) or the rating"), type: "number", required: true, step: 1, placeholder: "-40",
              validate: (_, all) => {
                const c = check(all);
                if ("delta" in c) return null;
                return c.error === "zero" ? t("That is their rating already.") : c.error === "range" ? t("Ratings stay between 100 and 4000.") : t("A whole number.");
              } },
            { type: "node", name: "rating-now", node: (all) => {
              const now = current(String(all.rules));
              const c = check(all);
              return (
                <div className="preview-box">
                  <span className="faint">{rulesName(all.rules as RulesId)}</span>
                  {"delta" in c
                    ? tf("{from} → {to} ({delta})", { from: fmtNum(now), to: fmtNum(c.after), delta: (c.delta > 0 ? "+" : "") + fmtNum(c.delta) })
                    : tf("Now {n}", { n: fmtNum(now) })}
                </div>
              );
            } },
            { name: "match", label: t("The game it is about"), optional: true, type: "select", value: game ? String(game.id) : "",
              options: [["", t("None")], ...(game && !games.some((g) => g.match_id === game.id) ? [[String(game.id), "#" + game.id] as [string, string]] : []),
                ...games.map((g) => [String(g.match_id), "#" + g.match_id + " · " + tf("against {name}", { name: g.opponent }) + " · " + fmtDate(g.at)] as [string, string])] },
            { name: "reason", label: t("Reason (shown to the player)"), type: "textarea", rows: 2, required: true, max: 300, placeholder: t("Rating farmed with a second account") },
          ]}
          preview={(v) => previewAction(u.username, "rating", body(v))}
          submit={t("Adjust the rating")} submitKind="danger"
          onSubmit={async (v) => {
            await post(u.username, "rating", body(v));
            toast(t("Rating adjusted."));
            void refresh();
          }} />
      ));
    },

    /** Annuls a finished rated game (administrators): both players get
     * their rating change back and are told. */
    voidMatch(m: VoidTarget, after?: () => void) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("Annul game #{id}?", { id: m.id })} icon={Undo2} tone="danger" wide
          text={tf("{a} and {b} get their rating change back (their charts show it); it leaves their rated games and wins. Once only: it can't be undone.", { a: m.names[0], b: m.names[1] })}
          fields={[{ name: "reason", label: t("Reason (shown to both players)"), type: "textarea", rows: 2, required: true, max: 300 }]}
          preview={(v) => previewCall("/matches/" + seg(m.id) + "/void", { reason: oneLine(v.reason) })}
          previewNames={m.names}
          submit={t("Annul the game")} submitKind="danger"
          onSubmit={async (v) => {
            await api("/matches/" + seg(m.id) + "/void", { method: "POST", body: { reason: oneLine(v.reason) } });
            toast(t("Game annulled."));
            done(after);
          }} />
      ));
    },

    /** Ends a stuck live game (administrators): given to one player, or
     * without a result. */
    endLive(r: LiveTarget, tournament: boolean, after?: () => void) {
      dialogs.open((close) => (
        <FormDialog onClose={close} title={tf("End live game #{id}?", { id: r.id })} icon={Square} tone="danger" wide
          text={t("For a game that is stuck. Both players are told.")}
          fields={[
            { name: "winner", label: t("Result"), type: "choices", value: "0", options: [
              ["0", tf("{name} wins (the other resigns)", { name: r.players[0] })],
              ["1", tf("{name} wins (the other resigns)", { name: r.players[1] })],
              ...(tournament ? [] : [["none", t("No result")] as [string, string]]),
            ] },
            { type: "node", name: "result-help", node: (v) => (
              <div className="hint">
                {v.winner === "none"
                  ? t("Nothing is recorded, no rating changes; both are sent back to sign in.")
                  : t("Rated as a resignation; a tournament goes on.")}
              </div>
            ) },
            { name: "reason", label: t("Reason (shown to both players)"), type: "textarea", rows: 2, required: true, max: 300, placeholder: t("Opponent's game froze") },
          ]}
          preview={(v) => previewCall("/live/" + seg(r.id) + "/end", { reason: oneLine(v.reason), ...(v.winner === "none" ? {} : { winner: Number(v.winner) }) })}
          previewNames={r.players}
          submit={t("End the game")} submitKind="danger"
          onSubmit={async (v) => {
            await api("/live/" + seg(r.id) + "/end", { method: "POST", body: { reason: oneLine(v.reason), ...(v.winner === "none" ? {} : { winner: Number(v.winner) }) } });
            toast(t("Game ended."));
            done(after);
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
