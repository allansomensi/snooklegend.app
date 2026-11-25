"use client";

import {
  Ban, CalendarDays, Coins, Download, Flag, Gavel, Gift, Info, Key, Lock, Mail, Megaphone, MessageSquare, MicOff, Pencil, Percent, Pin, PinOff, RefreshCw,
  Scale, Shield, SlidersHorizontal, Square, Star, StickyNote, Trash2, Trophy, TriangleAlert, Undo2, UserX, LogOut, WholeWord, Wrench, type LucideIcon,
} from "lucide-react";
import { msg } from "@/admin/i18n";
import type { AuditEntry } from "@/admin/lib/types";
import { useLocale } from "./providers/locale";
import { TimeAgo } from "./ui/bits";

/** Each staff action: its colour, icon and name. */
export const AUDIT: Record<string, [string, LucideIcon, string]> = {
  ban: ["danger", Ban, msg("Banned")],
  unban: ["success", Undo2, msg("Ban lifted")],
  mute: ["warning", MicOff, msg("Muted")],
  unmute: ["success", Undo2, msg("Unmuted")],
  kick: ["warning", UserX, msg("Disconnected")],
  warn: ["warning", TriangleAlert, msg("Warned")],
  note: ["info", StickyNote, msg("Staff note")],
  "note-remove": ["", Trash2, msg("Note removed")],
  "logout-all": ["", LogOut, msg("Signed out everywhere")],
  role: ["info", Shield, msg("Role changed")],
  "password-reset": ["warning", Key, msg("Password set")],
  coins: ["success", Coins, msg("Coins")],
  item: ["success", Gift, msg("Item given")],
  vip: ["success", Star, msg("VIP given")],
  revoke: ["danger", Gift, msg("Item taken back")],
  rename: ["info", Pencil, msg("Renamed")],
  "clear-status": ["", Trash2, msg("Status cleared")],
  report: ["info", Flag, msg("Report answered")],
  announce: ["info", Megaphone, msg("Announcement")],
  "clear-chat": ["danger", MessageSquare, msg("Chat cleared")],
  "chat-delete": ["warning", MessageSquare, msg("Chat line deleted")],
  motd: ["info", Megaphone, msg("Welcome message")],
  pin: ["info", Pin, msg("Note pinned")],
  unpin: ["", Pin, msg("Note taken down")],
  "remove-seek": ["", Trash2, msg("Board note removed")],
  payment: ["", Coins, msg("Payment marked")],
  "msstore-retry": ["", RefreshCw, msg("Store purchase sent again")],
  login: ["", Lock, msg("Signed in to the portal")],
  "tournament-cancel": ["danger", Trophy, msg("Tournament called off")],
  event: ["success", CalendarDays, msg("Event scheduled")],
  "event-cancel": ["danger", CalendarDays, msg("Event called off")],
  // 0.12: the inbox and moderation.
  message: ["info", Mail, msg("Message sent")],
  rating: ["warning", Scale, msg("Rating adjusted")],
  gift: ["success", Gift, msg("Present given")],
  "gift-batch": ["success", Gift, msg("Presents to many")],
  "match-void": ["danger", Undo2, msg("Game annulled")],
  "match-end": ["danger", Square, msg("Live game ended")],
  "banned-word": ["warning", WholeWord, msg("Banned word added")],
  "banned-word-remove": ["", WholeWord, msg("Banned word removed")],
  "chat-pin": ["info", Pin, msg("Chat line pinned")],
  "chat-unpin": ["", PinOff, msg("Chat line unpinned")],
  // 0.12: operations and the economy.
  setting: ["warning", SlidersHorizontal, msg("Setting changed")],
  "setting-reset": ["", SlidersHorizontal, msg("Setting reset")],
  promotion: ["success", Percent, msg("Promotion scheduled")],
  "promotion-edit": ["info", Percent, msg("Promotion changed")],
  "promotion-cancel": ["danger", Percent, msg("Promotion called off")],
  maintenance: ["warning", Wrench, msg("Maintenance scheduled")],
  "maintenance-cancel": ["", Wrench, msg("Maintenance called off")],
  auction: ["success", Gavel, msg("Auction opened")],
  "auction-cancel": ["danger", Gavel, msg("Auction called off")],
  export: ["", Download, msg("Data exported")],
};

export const auditLook = (action: string): [string, LucideIcon] => {
  const a = AUDIT[action];
  return a ? [a[0], a[1]] : ["", Info];
};

/** The actions whose target is a player (the others name an event, a
 * report, a payment, a place…, shown as plain text). */
export const PLAYER_ACTIONS = new Set(["ban", "unban", "mute", "unmute", "kick", "warn", "note", "logout-all", "role", "password-reset", "coins", "item",
  "vip", "revoke", "rename", "clear-status", "remove-seek", "chat-delete", "message", "rating", "gift", "match-void", "match-end"]);

const PLACES: Record<string, string> = { lounge: msg("the lounge"), board: msg("the board"), batch: msg("many players") };

export function useAuditWords() {
  const { t } = useLocale();
  return {
    auditLabel: (a: string) => t(AUDIT[a]?.[2] || a),
    auditTarget: (e: AuditEntry) => (PLACES[e.target] ? t(PLACES[e.target]) : e.target),
  };
}

/** A staff action in a short list (the dashboard). */
export function AuditMini({ e }: { e: AuditEntry }) {
  const { auditLabel, auditTarget } = useAuditWords();
  const [tone, Icon] = auditLook(e.action);
  const login = e.action === "login";
  return (
    <div className="mi">
      <span className={"tl-dot " + tone}>
        <Icon className="icon" aria-hidden />
      </span>
      <div className="mi-main">
        <span>
          <b>{e.staff}</b> · {auditLabel(e.action)}
          {e.target && !login ? " · " : null}
          {!login ? auditTarget(e) : null}
        </span>
        {e.details && !login ? <span className="mi-sub ellipsis">{e.details}</span> : null}
      </div>
      <span className="mi-side">
        <TimeAgo at={e.at} />
      </span>
    </div>
  );
}
