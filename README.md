<p align="center"><img src="public/brand/icon-128.png" width="96" alt="Snook Legend"></p>

# snooklegend.app

The website of [Snook Legend](https://github.com/allansomensi/snook-legend), a 3D
eight-ball pool game for Windows, macOS and Linux. Its job: show the game and get
it installed in a minute.

- **One button that downloads the right thing.** The page recognises the visitor's
  computer: on Windows the big button downloads the `.msi`; on a Mac or Linux it
  opens the one-line installer (with a copy button) and the files for each processor.
  After the click, a window walks through the installation, including what to do
  when Windows SmartScreen or macOS Gatekeeper complains about an unsigned program.
  On a phone, it offers to send the link.
- **Every way to install**, per system: the installer, the Microsoft Store, the
  portable `.zip`, PowerShell, the shell installer and the `.tar.xz` archives, with
  sizes, the SHA-256 checksums and the command that verifies them.
- **Always the latest version.** Downloads point at `releases/latest/download/…`, so
  they never go stale. The version number, sizes and checksums are read from the
  GitHub release while building, and again in the browser if a newer one came out.
- **A playable table**: a small 2D pool table (physics, cushions, pockets, aiming
  guide, sound; mouse, touch and keyboard) to try a shot before downloading.
- **In English, Portuguese and Spanish** (`/`, `/pt/`, `/es/`), with the game's own
  screenshots in each language. A first visit from a Portuguese or Spanish browser
  goes to its language; the choice in the menu is remembered.
- Players' profiles, the official tournaments, an illustrated rules guide, a
  rating calculator and the supporters (see below).
- Features, both sets of rules, the fifteen opponents, a screenshot gallery,
  system requirements and an FAQ; SEO metadata, Open Graph picture, `hreflang`,
  sitemap and structured data (`VideoGame`).

## The staff portal (`/admin`)

[snooklegend.app/admin](https://snooklegend.app/admin/) is the game's staff
portal: moderation, the lounge, events, the economy, metrics and the server,
for the game's moderators and administrators (what each page and action does,
and the roles: the game's [`docs/ADMIN.md`](https://github.com/allansomensi/snook-legend/blob/main/docs/ADMIN.md)).
It is part of this app (`src/app/admin/`, its code in `src/admin/`), with a
root layout of its own: none of the website's scripts (no analytics), its own
styles, `noindex`. It talks to the game server's staff API (`/admin/api`,
Rust, on Render) from the browser.

- **Signing in:** with a game account (moderator or administrator). The session
  is a bearer token kept for the tab only (`sessionStorage`, never a cookie, so
  there is no CSRF surface); it lasts 8 hours. When it ends, every page sends to
  `/admin/login`, and back to the same page after signing in again.
- **The API:** `src/admin/lib/api.ts` calls `NEXT_PUBLIC_API_URL` + `/admin/api`
  with the token; errors carry the server's own words, translated. The server
  answers browsers only from this site's origin (`SNOOK_LEGEND_ADMIN_ORIGIN` on
  the server: CORS, no credentials). Data: TanStack Query (Live and the chat
  refresh every 10 s, the dashboard every minute).
- **Security:** `src/proxy.ts` gives every `/admin` page a strict Content
  Security Policy with a fresh nonce (only the portal's own scripts run; the
  only server it talks to is the API); `next.config.ts` adds the other headers
  (no frames, no referrer, never in a search engine). The website's pages are
  untouched: prerendered, served from the CDN.
- **Languages:** Português (Brasil), English and Español. English is the key:
  every text goes through `t("…")`, `tf("…", {…})`, `tn(n, "…", "…")` or
  `msg("…")`; `src/admin/i18n/pt-BR.json` and `es.json` hold the translations,
  and `npm test` checks that every text has both, with the same placeholders.
- **Addresses:** every page, tab and filter has its own
  (`/admin/players/ana/moderation/`, `/admin/reports/?status=open`…).
- **Flags:** `public/flags.png` is the game's flag atlas
  (`crates/client/assets/flags.png`), in the order of `src/admin/lib/countries.ts`
  (`COUNTRIES` in the game's `crates/proto/src/countries.rs`). Copy both again
  when the game adds a country.

To run it against a local game server (from the game's repository; the
account in `SNOOK_LEGEND_ADMINS` must exist already, made in the game):

```bash
SNOOK_LEGEND_IN_MEMORY=1 SNOOK_LEGEND_ADMIN_ORIGIN=http://localhost:3000 SNOOK_LEGEND_ADMINS=yourname cargo run -p snook_legend_server
```

and here, with `NEXT_PUBLIC_API_URL=http://localhost:7878` in `.env.local`
(see `.env.example`), `npm run dev` and open http://localhost:3000/admin/.

## Players, tournaments, the rules and the rating

Pages made from the game server's public API (`NEXT_PUBLIC_API_URL` + `/api/…`),
rendered when first asked for and then kept a minute (ISR): a visitor gets the
last good page at once, and a server that doesn't answer keeps it in place.

| Page | English | Português | Español | Data |
|---|---|---|---|---|
| A player's profile | `/player/<name>/` | `/jogador/<name>/` | `/es/jugador/<name>/` | `GET /api/players/{name}` |
| The tournaments | `/tournaments/` | `/pt/torneios/` | `/es/torneos/` | `GET /api/tournaments` |
| A tournament (and its sharing picture) | `/tournaments/<id>/` | `/pt/torneios/<id>/` | `/es/torneos/<id>/` | `GET /api/tournaments/{id}` |
| Supporters | `/supporters/` | `/pt/apoiadores/` | `/es/mecenas/` | `GET /api/supporters` |
| The rules guide, illustrated | `/rules/` | `/pt/regras/` | `/es/reglas/` | `src/content/rules/` |
| The rating calculator | `/rating/` | `/pt/rating/` | `/es/rating/` | `src/lib/rating.ts` |

A player's page in Portuguese is `/jogador/<name>/` (the address the game
shares); `/pt/jogador/<name>/` redirects there. The addresses are in
`src/lib/routes.ts`; the readers of the API's answers, with tests and
fixtures, in `src/lib/` (`player.ts`, `tournaments.ts`, `supporters.ts`).

- **From the game:** the rules texts, the profile pictures, the names of the
  cues, frames and achievements (with their Portuguese and Spanish names from
  the game's translations): `python3 scripts/sync-game-data.py ../snook-legend`.
  The rating formula (`src/lib/rating.ts`) is a port of the game's
  `crates/core/src/rating.rs`: change both together (the tests hold numbers
  worked out by the Rust code).
- **Without the server:** `node scripts/mock-api.mjs` serves the fixtures on
  port 7878 (players `ana` and `bob`, tournaments 42, 43 and 44).

## The staff portal on a phone

The portal installs as an app (Add to Home Screen): `src/app/admin/manifest.webmanifest`
(scope `/admin/`), icons in `public/admin-icons/` (`node scripts/make-admin-icons.mjs`
makes them from `src/app/admin/icon.svg`), and a small service worker
(`src/app/admin/sw.js`) that keeps no page and nothing from the API: without a
connection it shows `/admin/offline.html`. The Content Security Policy allows
only the portal's own manifest and worker (`manifest-src`, `worker-src`).

## The terms of use and the privacy policy

The legal pages live here, in the site's frame, in each language:

| Page | English | Português | Español |
|---|---|---|---|
| Privacy policy | `/privacy/` | `/pt/privacidade/` | `/es/privacidad/` |
| Terms of use | `/terms/` | `/pt/termos/` | `/es/terminos/` |

The game and its server link to these addresses (the server's old `/privacidade`,
`/terms`… redirect here): change them only with redirects. The texts are in
`src/content/legal/` (Portuguese is the reference text; change the date in
`LEGAL_UPDATED`, `src/lib/legal.ts`, with the text).

Who provides the game is filled in while building, from environment variables
(Vercel → the project → Settings → Environment Variables, for Production and
Preview), so no personal data is kept in this repository:

| Variable | What |
|---|---|
| `LEGAL_CONTROLLER` | the person or company who provides the game and controls the data |
| `LEGAL_DOCUMENT` | their CPF or CNPJ (left out when empty) |
| `LEGAL_ADDRESS` | their address (left out when empty) |
| `LEGAL_CONTACT` | the e-mail (or web address) for support, refunds, appeals and privacy requests |

Brazilian law on online sales (Decreto 7.962/2013) asks a seller to show their
name, CPF or CNPJ, address and an electronic contact: set them all while the game
sells anything. A change to them takes a new deployment.

## Running it

Requires Node.js 20.9 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000. Before committing:

```bash
npm run check
```

## Building

`npm run build` prerenders the website's pages (plain HTML, served from the CDN)
and builds the portal's, rendered per request; `npm start` serves the result.

```bash
npm run build
```

```bash
npm start
```

While building, the latest release is read from the GitHub API (set `GITHUB_TOKEN`
to avoid its rate limit). Without network access, the release in
`src/lib/release.ts` (`FALLBACK_RELEASE`) is used.

## Deploying

The site and the staff portal are deployed by **Vercel** from this repository
(Git integration, the Next.js preset): every push to `main` is published at
[snooklegend.app](https://snooklegend.app), and every pull request gets a preview.
One environment variable: `NEXT_PUBLIC_API_URL` = `https://api.snooklegend.app`
(the game server, for the portal). On the game server, `SNOOK_LEGEND_ADMIN_ORIGIN`
= `https://snooklegend.app` lets the portal call the staff API (a preview's
address is a different origin: its portal can't, by design).

`.github/workflows/ci.yml` checks each push and pull request (types, lint, the
portal's tests, a build). It can also keep the site in step with the game's releases:

- **Daily rebuild:** in Vercel, the project → Settings → Git → **Deploy Hooks**,
  create one for `main`, and save its URL as the repository secret
  `VERCEL_DEPLOY_HOOK` (GitHub → Settings → Secrets and variables → Actions).
  The workflow then asks Vercel for a fresh build every day.
- **Right after a release:** the game's release workflow can send a
  `repository_dispatch` with the event type `game-released` to this repository,
  which triggers the same rebuild.

Optional: a `GITHUB_TOKEN` environment variable in Vercel (any token that can read
public repositories) avoids GitHub's rate limit when the build reads the release.
Without it the build still works, and falls back to the release in
`src/lib/release.ts` if GitHub says no.

The website's pages are prerendered at build time; the portal's pages are
rendered per request (Vercel's functions). Any host that runs Next.js works
(`npm run build`, `npm start`).

### Analytics

[Vercel Web Analytics](https://vercel.com/docs/analytics) (cookieless) is built in:
`<Analytics />` is added to the page only when the site is built on Vercel
(`VERCEL=1`), since Vercel serves its script; on other hosts nothing is loaded.
Turn it on in the Vercel project: **Analytics → Enable**.

Besides page views, the site sends custom events (Vercel shows them on the plans
that include custom events):

| Event | When | Data |
|---|---|---|
| `Download` | a download button is clicked | `os`, `file` |
| `Install command` | the macOS/Linux install window opens | `os` |
| `Copy command` | a command is copied | `command`: `shell`, `powershell` or `verify` |
| `Microsoft Store` | the Store link is clicked | |

## Changing things

| What | Where |
|---|---|
| Texts (all three languages) | `src/i18n/en.ts`, `pt.ts`, `es.ts` |
| Links, file names, the Microsoft Store page | `src/lib/site.ts` |
| Colours, fonts, buttons | `src/app/globals.css` (`@theme`) |
| Sections of the page | `src/components/HomePage.tsx` |
| The rules guide's animated tables | `src/lib/scenes.ts`, `src/components/RuleScene.tsx` |
| The playable table | `src/components/PoolTable.tsx` |
| Pictures (from the game's repository) | `python3 scripts/make-assets.py ../snook-legend` |

The Microsoft Store link is a search for now. Once the product page's address is at
hand (`https://apps.microsoft.com/detail/<id>`), put it in `MS_STORE_URL`, or set
`NEXT_PUBLIC_MS_STORE_URL` when building.

A new language: copy `src/i18n/en.ts`, translate it, add it to `LOCALES` and
`LOCALE_INFO` in `src/i18n/index.ts` and to `generateStaticParams` in
`src/app/[lang]/layout.tsx`, and add its screenshots to `public/shots/<code>/`.

## Stack

[Next.js](https://nextjs.org) 16 (App Router; the website prerendered, the
portal rendered per request with a nonce-based CSP), React 19, TypeScript
(strict), [Tailwind CSS](https://tailwindcss.com) 4, [Lucide](https://lucide.dev)
icons and Vercel Web Analytics; for the portal,
[TanStack Query](https://tanstack.com/query), [Radix UI](https://www.radix-ui.com)
(dialogs and menus) and [Vitest](https://vitest.dev). Fonts: Bricolage Grotesque, Geist and Geist Mono.

## License

[MIT](LICENSE). The screenshots and art come from the game's repository.
