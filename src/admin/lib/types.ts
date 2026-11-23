// What the staff API sends (crates/server/src/admin.rs). Times are Unix
// seconds; days (metrics) are days since 1970-01-01, hours likewise.

export type Role = "player" | "moderator" | "admin";
export type RulesId = "brazilian" | "official";

export interface Me {
  username: string;
  role: Role;
}

export interface Record_ {
  rating?: number;
  peak_rating?: number;
  tier?: string;
  games?: number;
  wins?: number;
}
export type Records = Partial<Record<RulesId, Record_>>;
export type PerRules = Partial<Record<RulesId, number>>;

export interface UserRow {
  id: number;
  username: string;
  role: Role;
  country?: string | null;
  online?: boolean;
  created_at: number;
  last_seen?: number | null;
  banned_until?: number | null;
  ban_reason?: string | null;
  muted_until?: number | null;
  deleted_at?: number | null;
  records?: Records;
}

export interface UsersPage {
  users: UserRow[];
  total: number;
  per_page: number;
}

export interface User extends UserRow {
  casual_games: number;
  abandons: number;
  name_changes: number;
  recovery_email?: string | null;
  status_message?: string | null;
}

export interface Note {
  id: number;
  kind: "note" | "warning";
  author: string;
  text: string;
  created_at: number;
  delivered_at?: number | null;
}

export interface AuditEntry {
  id: number;
  at: number;
  staff: string;
  action: string;
  target: string;
  details: string;
}

export interface ReportGame {
  kind: "stored" | "live" | "gone";
  id: number;
  players: [string, string];
  rules: RulesId;
  rated: boolean;
  shots: number;
  at?: number;
  finished?: boolean;
}

export interface Report {
  id: number;
  reporter: string;
  target: string;
  reason: string;
  details?: string;
  context?: string;
  created_at: number;
  /** 0 open, 1 action taken, 2 dismissed. */
  status: number;
  resolved_by?: string | null;
  resolution?: string | null;
  game?: ReportGame | null;
}

export interface GameRow {
  match_id: number;
  at: number;
  rules: RulesId;
  opponent: string;
  won: boolean;
  reason: string;
  rated: boolean;
  delta: number;
  rating_after: number;
  replay: boolean;
}

export interface Payment {
  id: string;
  at: number;
  payer?: string;
  kind: "coins" | "vip";
  coins: number;
  amount: number;
  currency: string;
  refunded: boolean;
  test: boolean;
}

export interface MsStorePurchase {
  tracking_id: string;
  created_at: number;
  pack: string;
  coins: number;
  state: "done" | "pending" | "stuck" | "failed";
  attempts: number;
  last_error?: string | null;
  order_ids?: string | null;
}

export interface Computer {
  tour_won_at?: number | null;
  finals?: number;
  finals_kept?: number;
  last_final?: number | null;
  medals?: { knockout: [number, number, number]; arena: [number, number, number] };
  recent_medals?: { at: number; place: number; format: "arena" | "knockout"; cup: string }[];
  drills?: { code: string; name?: string; best: number; stars: number }[];
  drill_stars?: number;
  drill_stars_max?: number;
  daily_wins?: number;
}

export interface UserDetail {
  user: User;
  notes: Note[];
  reports: Report[];
  moderation: AuditEntry[];
  history: GameRow[];
  achievements: [string, number][];
  wallet: { coins: number; vip_until: number; owned: string[] };
  payments: Payment[];
  msstore?: MsStorePurchase[];
  ledger: { at: number; delta: number; reason: string }[];
  career?: { shots?: number; potting_shots?: number; best_run?: number };
  computer?: Computer;
  presence?: { status: string; rules: RulesId } | null;
  payment_email?: string | null;
  private_hidden?: boolean;
}

export interface Overview {
  online: number;
  online_by_rules: PerRules;
  matches_live: number;
  tables_open: number;
  addresses: number;
  persistent: boolean;
  uptime_secs: number;
  version: string;
  motd: string;
  stored: {
    users: number;
    new_users_7d: number;
    active_users_7d: number;
    open_reports: number;
    matches_24h: number;
    matches_24h_by_rules: PerRules;
    matches_total: number;
  };
}

export interface HourSample {
  hour: number;
  active: number;
  peak_players: number;
  games: number;
  peak_games: number;
}

export interface Metrics {
  now: number;
  online: number;
  online_by_rules: PerRules;
  games: number;
  draining: boolean;
  countries?: [string, number][];
  queue: {
    size: number;
    median_wait_secs: number;
    avg_wait_secs: number;
    pairs: number;
    recent?: number[];
    waiting: { rules: RulesId; secs: number }[];
  };
  metrics: {
    hours: HourSample[];
    /** [day, players active, games] */
    days: [number, number, number][];
    /** [currency, cents, payments] */
    revenue: [string, number, number][];
    /** [day, currency, cents] */
    revenue_days: [number, string, number][];
    retention_d1: number;
    retention_d7: number;
    retention_d30: number;
    /** [accounts, played a game, played five] */
    funnel: [number, number, number];
    cohorts?: { first_day: number; accounts: number; d1: number | null; d7: number | null; d30: number | null }[];
  };
}

export interface LivePlayer {
  username: string;
  role?: Role;
  vip?: boolean;
  guest?: boolean;
  status: string;
  searching?: boolean;
  vs_computer?: boolean;
  away?: boolean;
  rules: RulesId;
  country?: string | null;
  standings?: Records;
}

export interface Room {
  id: number;
  players: [string, string];
  rules: RulesId;
  rated: boolean;
  tournament?: boolean;
  shots: number;
  finished: boolean;
}

export interface Tournament {
  id: string | number;
  name: string;
  state: "registering" | "running" | "finished";
  rules: RulesId;
  format: "arena" | "knockout";
  rated: boolean;
  private?: boolean;
  host?: string | null;
  size: number;
  entry_fee: number;
  starts_at?: number | null;
  players: { username: string; standings?: Records; records?: Records }[];
  champion?: string | null;
  rounds?: { players: [string | null, string | null]; winner?: number | null; live?: boolean }[][];
  standings?: ({ username: string; points: number } | [string, number])[];
}

export interface Live {
  rooms: Room[];
  players: LivePlayer[];
  tournaments: Tournament[];
}

export interface System {
  now: number;
  version: string;
  protocol: number;
  oldest_protocol: number;
  uptime_secs: number;
  memory_bytes: number | null;
  online: number;
  online_by_rules: PerRules;
  addresses: number;
  games: number;
  tables: number;
  queue: number;
  tournaments: number;
  pending_writes: number;
  persistent: boolean;
  draining: boolean;
  stripe: boolean;
  /** Stripe with a test key: payments work, but nothing is charged. */
  stripe_test?: boolean;
  msstore: boolean;
  /** The last Microsoft Store game seen since the server started: whether
   * its package sells add-ons (MSSTORE_PURCHASES), and when it connected. */
  msstore_game?: { sales: boolean; seen_at: number } | null;
  settings: {
    shot_clock_secs: number;
    reconnect_grace_secs: number;
    chat_history: number;
    max_connections_per_ip: number;
    tournament_no_show_secs: number;
    max_open_tournaments: number;
    seek_lifetime_secs: number;
    lan: boolean;
    cup?: {
      name: string;
      weekday: number;
      hour: number;
      minute: number;
      utc_offset: number;
      minutes: number;
      entry_fee: number;
      rules: RulesId;
    } | null;
  };
}

export interface ChatLine {
  id: number;
  at: number;
  kind?: "player" | "system" | "announcement" | string;
  from: string;
  text: string;
  admin?: boolean;
  deleted?: "author" | "staff" | "removed" | null;
}

export interface BoardNote {
  id: number;
  kind: "notice" | "event" | "rule";
  text: string;
  author?: string;
  created_at: number;
  expires_at?: number | null;
  pinned?: boolean;
  action?: string | null;
}

export interface Seek {
  username: string;
  text?: string;
  rated: boolean;
  at: number;
}

export interface GameEvent {
  id: number;
  kind: "xp" | "coins" | "tournament";
  title: string;
  status: "live" | "scheduled" | "ended" | "cancelled";
  starts_at: number;
  ends_at: number;
  cancelled_at?: number | null;
  created_by?: string;
  created_at: number;
  multiplier: number;
  rules: RulesId;
  format: "arena" | "knockout";
  size: number;
  rated: boolean;
  entry_fee: number;
  prize: number;
}

export interface EventLimits {
  max_multiplier: number;
  max_title: number;
  max_entry_fee: number;
  max_prize: number;
  knockout_sizes: number[];
}

export interface CatalogItem {
  code: string;
  name: string;
  category: string;
  how: string;
  coins?: number | null;
  achievement?: string | null;
}

export interface Economy {
  catalog: CatalogItem[];
  payments: Payment[];
  private_hidden?: boolean;
  stripe: boolean;
  economy: {
    coins_total: number;
    wallets: number;
    vip_now: number;
    flows: { kind: string; credited: number; debited: number; entries: number }[];
    richest: [string, number][];
  };
}

export interface FairPlay {
  min_attempts: number;
  players: number;
  flagged: {
    username: string;
    rating: number;
    tier: string;
    made: number;
    attempts: number;
    rate: number;
    tier_mean: number;
    tier_players: number;
    z: number;
  }[];
}

export interface Pocket {
  name: string;
  x: number;
  y: number;
  r: number;
}

export interface Stroke {
  kind: "shot" | "resign" | "abandon" | "time_foul" | "choice";
  seat: number;
  start: ([number, number] | null)[];
  frames: (number | null)[][];
  option?: string;
  break?: boolean;
  first?: number | null;
  pocketed?: { ball: number; pocket: string }[];
  fouls?: string[];
  called?: string | null;
  penalty?: number[];
  break_again?: boolean;
  choice?: string | Record<string, unknown> | null;
  in_hand?: boolean;
  timeout?: boolean;
  power?: number;
}

export interface ReplayView {
  fps: number;
  rules: RulesId;
  table: { length: number; width: number; ball_radius: number; cushions: [number, number, number, number][]; pockets: Pocket[] };
  strokes: Stroke[];
  end: ([number, number] | null)[];
  over?: { winner: number; reason: string } | null;
  error?: string | null;
  match: {
    id?: number;
    players: [string, string];
    rated?: boolean;
    live?: boolean;
    at?: number;
  };
}
