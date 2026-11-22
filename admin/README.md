# Snook Legend · staff portal

The staff portal of [Snook Legend](https://github.com/allansomensi/snook-legend):
moderation, the lounge, events, the economy, metrics and the server, for the
game's moderators and administrators. It lives at
[admin.snooklegend.app](https://admin.snooklegend.app) and talks to the game
server's staff API (`/admin/api`, Rust) from the browser.

What it does page by page, the roles and what each action does are described in
the game's repository, [`docs/ADMIN.md`](https://github.com/allansomensi/snook-legend/blob/main/docs/ADMIN.md).

## Stack

[Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript (strict),
[Tailwind CSS](https://tailwindcss.com) 4, [TanStack Query](https://tanstack.com/query)
for the API's data (cache, refreshes every 10 s on Live and the chat, every
minute on the dashboard), [Radix UI](https://www.radix-ui.com) for dialogs and
menus (focus kept inside, Esc, the keyboard returns where it was) and
[Lucide](https://lucide.dev) icons. Tests: Vitest.

## How it is put together

- **Signing in:** with a game account (moderator or administrator). The session
  is a bearer token kept for the tab only (`sessionStorage`, never a cookie, so
  there is no CSRF surface); it lasts 8 hours. When it ends, every page sends to
  `/login`, and back to the same page after signing in again.
- **The API:** `src/lib/api.ts` calls `NEXT_PUBLIC_API_URL` + `/admin/api` with the
  token; errors carry the server's own words, translated. The server answers the
  browser only for the portal's origin (`SNOOK_LEGEND_ADMIN_ORIGIN` on the
  server: CORS, no credentials).
- **Security:** `src/proxy.ts` sets a strict Content Security Policy with a fresh
  nonce for every page (only the portal's own scripts run; the only server it
  talks to is the API), and `next.config.ts` the other headers (no frames, no
  referrer, never in a search engine).
- **Languages:** Português (Brasil), English and Español. English is the key:
  every text goes through `t("…")`, `tf("…", {…})`, `tn(n, "…", "…")` or
  `msg("…")`, and `src/i18n/pt-BR.json` / `es.json` hold the translations.
  `npm test` checks that every text has both, with the same `{placeholders}`.
- **Pages:** `src/app/(portal)/<page>/page.tsx`; each address (filters, tabs,
  searches included) can be bookmarked or sent to another staff member.
- **Flags:** `public/flags.png` is the game's flag atlas
  (`crates/client/assets/flags.png`), in the order of `src/lib/countries.ts`
  (`COUNTRIES` in the game's `crates/proto/src/countries.rs`). Copy both again
  when the game adds a country.

## Running it

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL: the game server
npm run dev                  # http://localhost:3001
```

A local game server for it (from the game's repository), allowing this origin:

```bash
SNOOK_LEGEND_IN_MEMORY=1 SNOOK_LEGEND_ADMIN_ORIGIN=http://localhost:3001 SNOOK_LEGEND_ADMINS=yourname cargo run -p snook_legend_server
```

(`SNOOK_LEGEND_ADMINS` names an account that must exist already, made in the
game: register it first, then start the server with the variable.)

`npm run check` runs the types, the lint and the tests; `npm run build` the
production build.

## Deploying (Vercel)

A second Vercel project from this repository:

1. Vercel → **Add New… → Project** → this repository → **Root Directory:
   `admin`** (the Next.js preset is detected).
2. **Environment variable:** `NEXT_PUBLIC_API_URL` = `https://api.snooklegend.app`.
3. **Domain:** `admin.snooklegend.app` (Settings → Domains).
4. On the game server (Render): `SNOOK_LEGEND_ADMIN_ORIGIN` =
   `https://admin.snooklegend.app`, so the API answers the portal.

Every push to `main` that touches `admin/` publishes it; pull requests get a
preview (the API answers a preview only if its origin is the one set on the
server).
