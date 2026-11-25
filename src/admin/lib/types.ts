// What the staff API sends (crates/server/src/admin.rs). Times are Unix
// seconds; days (metrics) are days since 1970-01-01, hours likewise.

export type Role = "player" | "moderator" | "admin";
export type RulesId = "brazilian" | "official";

export interface Me {
  username: string;
  role: Role;
  /** A code of the game's pictures ("" or absent: none). */
  avatar?: string | null;
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
  /** A code of the game's pictures ("" or absent: none). */
  avatar?: string | null;
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
  /** The latest 50 notifications sent to them (0.12). */
  notifications?: Notification[];
  /** Changes of name and country (0.12). */
  renames?: ProfileChange[];
  /** Ratings put right by the staff (0.12). */
  rating_adjustments?: RatingAdjustment[];
  /** Their doubles records under each of the rules (0.12; read with
   * `parseDoublesRatings`). */
  doubles_ratings?: unknown;
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
  /** Real usernames written with "@". */
  mentions?: string[];
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
  /** The champion's percent of the prizes (0: the usual shares). */
  champion_share?: number;
  /** An item only won, for the champion ("" : none). */
  item_prize?: string;
}

export interface EventLimits {
  max_multiplier: number;
  max_title: number;
  max_entry_fee: number;
  max_prize: number;
  knockout_sizes: number[];
  max_boost_days?: number;
  /** An arena's shortest and longest length, in minutes. */
  arena_minutes?: [number, number];
}

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface CatalogItem {
  code: string;
  name: string;
  category: string;
  /** coins, free, achievement, vip, pack or earned (only won). */
  how: string;
  coins?: number | null;
  achievement?: string | null;
  rarity?: Rarity | null;
  /** Can't be given nor put up for auction. */
  bound?: boolean;
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

// ------------------------------------------------- inbox & moderation (0.12)

/** Where a notification's button leads in the game. */
export interface InboxAction {
  to: string;
  match_id?: number;
  code?: string;
  id?: number;
  username?: string;
}

/** A notification as the game reads it, with the fields of its kind. */
export interface Notification {
  id: number;
  kind: string;
  text?: string;
  from?: string;
  created_at: number;
  /** When it was read (an important one: confirmed); 0 or null: not yet. */
  read_at?: number | null;
  important?: boolean;
  /** At the top of the inbox until then (0: not pinned). */
  pinned_until?: number;
  action?: InboxAction;
  /** The staff's view: its filter, its words in English, when the player
   * took it out of their inbox. */
  category?: string;
  title?: string;
  body?: string;
  deleted_at?: number | null;
  // The fields of the kinds.
  until?: number;
  rules?: RulesId;
  delta?: number;
  rating?: number;
  match_id?: number;
  opponent?: string;
  won?: boolean | null;
  username?: string;
  coins?: number;
  item?: string;
  vip_days?: number;
  code?: string;
  name?: string;
  place?: number;
  prize?: number;
}

export type PreviewLang = "en" | "pt" | "es";

/** What a player would be told (`"preview": true`), in the game's words. */
export interface Preview {
  preview: true;
  category: string;
  notification: Notification;
  rendered: Record<PreviewLang, { title: string; body: string }>;
  /** Actions that tell both players (annul, end a game): seat 0 and 1. */
  players?: Preview[];
}

export interface ProfileChange {
  user_id: number;
  kind: "name" | "country";
  old: string;
  new: string;
  at: number;
  /** The staff member who made it (empty: the player). */
  by: string;
}

export interface RatingAdjustment {
  id: number;
  user_id: number;
  rules: RulesId;
  delta: number;
  rating_after: number;
  reason: string;
  match_id?: number | null;
  staff: string;
  at: number;
}

export type TimelineItem =
  | ({ type: "notification"; at: number } & Notification)
  | { type: "staff_action"; at: number; action: string; staff: string; details: string }
  | { type: "match"; at: number; match_id: number; opponent: string; won: boolean; rated: boolean; rules: RulesId; delta: number; reason: string; correspondence?: boolean }
  | { type: "purchase"; at: number; coins: number; reason: string }
  | { type: "payment"; at: number; kind: "coins" | "vip"; coins: number; amount: number; currency: string; refunded: boolean; test: boolean }
  | { type: "report_sent"; at: number; id: number; target: string; reason: string; status: number }
  | { type: "report_received"; at: number; id: number; reporter: string; reason: string; status: number }
  | { type: "profile_change"; at: number; kind: "name" | "country"; old: string; new: string; by: string }
  | { type: "linked_account"; at: number; username: string }
  | { type: "account"; at: number; username: string; country?: string | null };

export type TimelineType = TimelineItem["type"];

export interface TimelinePage {
  items: TimelineItem[];
  /** Pass as `before` for the next page (null: no more). */
  next: number | null;
}

/** How a player got an item. */
export interface ItemOrigin {
  how: "bought" | "gift" | "staff" | "tournament" | "achievement" | "auction" | "vip_month" | "event" | "season" | "welcome_pack" | "unknown" | string;
  price?: number;
  from?: string;
  reason?: string;
  name?: string;
  place?: number;
  code?: string;
  month?: string;
}

export interface CollectionItem {
  code: string;
  name: string | null;
  category: string;
  rarity: Rarity | null;
  bound: boolean;
  origin: ItemOrigin;
  /** 0: not known. */
  acquired_at: number;
}

export interface Collection {
  username: string;
  items: CollectionItem[];
}

/** A stored game as the staff look it up. */
export interface MatchRow {
  id: number;
  players: [number, number];
  names: [string, string];
  winner: number;
  reason: string;
  rated: boolean;
  rules: RulesId;
  delta: [number, number];
  ratings_after: [number, number];
  shots: number;
  ended_at: number;
  tournament: number | null;
  room: number | null;
  voided_at: number | null;
}

export interface MatchStroke {
  index: number;
  kind?: "shot" | "time_foul" | "choice" | "resign" | "abandon";
  seat?: number;
  player?: string;
  /** The cue's speed, m/s. */
  power?: number;
  aim_degrees?: number;
  elevation_degrees?: number;
  /** Where the tip struck, −1…1. */
  spin?: { side: number; top: number };
  /** Where the cue ball was placed with the ball in hand (mm). */
  cue_ball?: [number, number] | null;
  called?: string | null;
  timeout?: boolean;
  /** From the shot clock's start (games from 0.12 on). */
  think_secs?: number | null;
  potted?: { ball: number; pocket: string }[];
  fouls?: string[];
  first_contact?: number | null;
  break?: boolean;
  continues?: boolean;
  option?: string;
  /** The replay couldn't go on from here. */
  error?: string;
}

export interface MatchDetail {
  match: MatchRow;
  /** null without a replay. */
  strokes: MatchStroke[] | null;
}

export interface BannedWord {
  word: string;
  /** A language code, or "*" for all. */
  lang: string;
  added_by: string;
  added_at: number;
}

export interface WordCheck {
  blocked: boolean;
  word: string | null;
  lang: string | null;
  tokens: string[];
}

export interface BatchResult {
  dry_run?: boolean;
  ok?: boolean;
  /** Dry run: how many known players. */
  players?: number;
  given?: string[];
  unknown: string[];
  already_own: string[];
}

// ------------------------------------------- operations & economy (0.12)

export type SettingType = "int" | "bool" | "text" | "choice" | "time" | "item";
export type SettingValue = number | boolean | string;

export interface Setting {
  key: string;
  group: "games" | "lounge" | "limits" | "tournaments" | "weekly_cup" | "economy" | string;
  type: SettingType;
  value: SettingValue;
  default: SettingValue;
  /** default (built in), env (an environment variable) or portal. */
  source: "default" | "env" | "portal";
  description: string;
  range: { min?: number; max?: number; max_length?: number; options?: string[]; format?: string } | null;
  updated_by: string | null;
  updated_at: number | null;
}

export type ScheduleStatus = "scheduled" | "live" | "ended" | "cancelled";

export interface Promotion {
  id: number;
  title: string;
  kind: "discount" | "featured";
  percent: number;
  codes: string[];
  categories: string[];
  starts_at: number;
  ends_at: number;
  created_by: string;
  created_at: number;
  cancelled_at: number | null;
  status: ScheduleStatus;
}

export interface Promotions {
  promotions: Promotion[];
  categories: string[];
  limits: { max_percent: number; max_days: number; max_title: number };
  now: number;
}

export interface OfficialLive {
  id: number;
  name: string;
  state: "registering" | "running" | "finished";
  format: "arena" | "knockout";
  rules: RulesId;
  players: number;
  size: number;
  entry_fee: number;
  prize_pool: number;
  prizes: number[];
  item_prize: string;
  starts_at: number | null;
  ends_at: number | null;
}

export interface OfficialFinished {
  id: number;
  event_id: number | null;
  name: string;
  rules: RulesId;
  format: "arena" | "knockout";
  size: number;
  players: number;
  rated: boolean;
  entry_fee: number;
  prize_pool: number;
  prizes: number[];
  item_prize: string;
  champion_id: number | null;
  runner_up_id: number | null;
  starts_at: number;
  ends_at: number;
}

export interface Officials {
  scheduled: GameEvent[];
  live: OfficialLive[];
  finished: OfficialFinished[];
  weekly_cup: { name: string; next_start: number; format: "arena" | "knockout"; entry_fee: number; house_prize: number; rules: RulesId } | null;
  house_cut_percent: number;
  /** Items only won: those a tournament may give its champion. */
  item_prizes: string[];
  now: number;
}

export interface Maintenance {
  id: number;
  at: number;
  minutes: number;
  message: string;
  created_by: string;
  created_at: number;
  cancelled_at: number | null;
  started_at: number | null;
  status: "scheduled" | "due" | "started" | "cancelled";
}

export interface Maintenances {
  maintenance: Maintenance[];
  limits: { max_minutes: number; max_message: number };
  notices_minutes: number[];
  draining: boolean;
  now: number;
}

export interface Auction {
  id: number;
  code: string;
  name: string | null;
  starts_at: number;
  ends_at: number;
  min_bid: number;
  min_increment: number;
  leader_id: number | null;
  leader: string;
  bid: number;
  bids: number;
  created_by: string;
  created_at: number;
  cancelled_at: number | null;
  settled_at: number | null;
  state: "coming" | "open" | "ended" | "cancelled";
  latest_bids: { username: string; amount: number; at: number }[];
}

export interface Auctions {
  auctions: Auction[];
  items: { code: string; name: string; price: number | null; rarity: Rarity }[];
  limits: { max_days: number; max_bid: number; extension_secs: number; snipe_window_secs: number };
  now: number;
}

export type CoinHealth = "deflating" | "healthy" | "watch" | "inflating" | "unknown";

export interface CoinDay {
  day: number;
  date: string;
  created: number;
  spent: number;
  net: number;
  by_source: Record<string, number>;
  by_sink: Record<string, number>;
  /** Coins in wallets at the end of the day. */
  supply: number;
}

export interface CoinAnalytics {
  days: CoinDay[];
  totals: { created: Record<string, number>; spent: Record<string, number> };
  supply: number;
  wallets: number;
  net_7d: number;
  net_7d_percent: number;
  health: CoinHealth;
}

export interface SalesPeriod {
  sales: number;
  coins: number;
  buyers: number;
}

export interface Sellers {
  items: {
    code: string;
    name: string | null;
    category: string | null;
    rarity: Rarity | null;
    price: number | null;
    last_sold_at: number | null;
    days_7: SalesPeriod;
    days_30: SalesPeriod;
    all_time: SalesPeriod;
  }[];
  categories: { category: string; sales: number; coins: number; coins_30d: number }[];
  never_sold: { code: string; name: string; category: string; price: number | null }[];
}

export interface CountryRow {
  /** "": not given. */
  country: string;
  players: number;
  new_7d: number;
  online: number;
}

export interface PeakHours {
  weeks: number;
  utc_offset_minutes: number;
  cells: { weekday: number; hour: number; avg: number; max: number; samples: number }[];
}

export type VipSource = "stripe" | "microsoft_store" | "gift" | "staff";

export interface VipAnalytics {
  active: number;
  renewed_this_month: number;
  new_this_month: number;
  lapsed_90d: number;
  by_source: Partial<Record<VipSource, number>>;
  members: { username: string; country: string | null; until: number; source: VipSource; since: number; last_payment: number; months: number; subscriber: boolean }[];
  lapsed: { username: string; country: string | null; ended_at: number; source: VipSource; months: number }[];
  now: number;
}

export type CalendarKind = "event" | "tournament" | "weekly_cup" | "promotion" | "maintenance" | "auction" | "vip_item";

export interface CalendarItem {
  kind: CalendarKind;
  title: string;
  starts_at: number;
  ends_at: number;
  /** The thing's id (a VIP item: its code; a coming weekly cup: null). */
  id: number | string | null;
  status: "scheduled" | "live" | "ended" | "cancelled" | "started";
}

export interface CalendarRange {
  from: number;
  to: number;
  now: number;
  items: CalendarItem[];
}

// -------------------------------------------- 0.12's modes (admin/modes.rs)

/** Two of a kind: a doubles game's teams, a team's players (the team's
 * first player first). */
export type Pair<T> = [T, T];

/** A doubles game being played (or just over) in this server. */
export interface LiveDoubles {
  /** The lounge's room. */
  id: number;
  teams: Pair<Pair<string>>;
  rated: boolean;
  rules: RulesId;
  shots: number;
  finished: boolean;
}

/** A stored doubles game. `teams`, `countries`, `player_ids`, `deltas`:
 * `[team][player]`. */
export interface DoublesGame {
  id: number;
  /** The room it was played in (the live game's id). */
  room: number | null;
  teams: Pair<Pair<string>>;
  countries: Pair<Pair<string>>;
  player_ids: Pair<Pair<number>>;
  /** The team that won. */
  winner: 0 | 1;
  reason: string;
  rated: boolean;
  rules: RulesId;
  deltas: Pair<Pair<number>>;
  shots: number;
  ended_at: number;
  /** A replay was kept. */
  replay: boolean;
  voided_at: number | null;
}

/** A stored doubles game with its replay (`GET /doubles/{id}`). */
export interface DoublesDetail extends DoublesGame {
  /** null without a replay. */
  strokes: number | null;
  /** The replay as the game keeps it (seed, breaker, rules, strokes). */
  replay_data: Record<string, unknown> | null;
}

export interface DoublesPage {
  live: LiveDoubles[];
  games: DoublesGame[];
  /** The next page's `before`; null at the end. */
  next: number | null;
}

/** A player's doubles record under one of the rules. */
export interface DoublesRecord {
  rating: number;
  peak_rating: number;
  games: number;
  wins: number;
}
export type DoublesRatings = Record<RulesId, DoublesRecord>;

/** A line of a week's table against the clock: a player's best. */
export interface ClockRow {
  place: number;
  user_id: number;
  username: string;
  country: string;
  ms: number;
  /** "0:45.2" */
  time: string;
  at: number;
}

export interface ClockWeek {
  week: number;
  this_week: number;
  starts_at: number;
  ends_at: number;
  /** The players in the week's table (all of them, not just those sent). */
  players: number;
  /** The coins of the first three as set now. */
  prizes: number[];
  board: ClockRow[];
}

/** An attempt against the clock. `ms` (the clock plus 10 s a foul),
 * `shots` and `fouls`: null when not cleared, refused or never sent. */
export interface ClockAttempt {
  id: number;
  username: string;
  /** The day (UTC, days since 1970) it was started on. */
  day: number;
  started_ms: number;
  finished_ms: number | null;
  ms: number | null;
  time: string | null;
  shots: number | null;
  fouls: number | null;
  /** The week it counted in, and when. */
  week: number | null;
  at: number | null;
  /** In its week's ranking (and not taken off). */
  counted: boolean;
  removed_at: number | null;
  removed_reason: string | null;
}

export interface ClockAttempts {
  username: string;
  this_week: { week: number; best_ms: number | null; place: number | null };
  attempts: ClockAttempt[];
}

/** The answer to taking an attempt off: their best of its week now. */
export interface ClockRemoved {
  attempt: ClockAttempt;
  best_ms: number | null;
}
