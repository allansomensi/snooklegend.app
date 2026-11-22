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
- Features, both sets of rules, the fifteen opponents, a screenshot gallery,
  system requirements and an FAQ; SEO metadata, Open Graph picture, `hreflang`,
  sitemap and structured data (`VideoGame`).

## The staff portal

[`admin/`](admin/) is the game's staff portal
([admin.snooklegend.app](https://admin.snooklegend.app)): its own Next.js app,
with its own checks and its own Vercel project (Root Directory `admin`). See
[`admin/README.md`](admin/README.md).

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

The site is a static export: `npm run build` writes plain HTML, CSS and JS to
`out/`, which any static host can serve.

```bash
npm run build
```

```bash
npm run preview
```

While building, the latest release is read from the GitHub API (set `GITHUB_TOKEN`
to avoid its rate limit). Without network access, the release in
`src/lib/release.ts` (`FALLBACK_RELEASE`) is used.

## Deploying

The site is deployed by **Vercel** from this repository (Git integration, the
Next.js preset; nothing else to configure): every push to `main` is published at
[snooklegend.app](https://snooklegend.app), and every pull request gets a preview.

`.github/workflows/ci.yml` checks each push and pull request (types, lint, a
build; the same for the staff portal in `admin/`). It can also keep the site in step with the game's releases:

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

Any other static host works too: build command `npm run build`, output folder `out`.

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
| The playable table | `src/components/PoolTable.tsx` |
| Pictures (from the game's repository) | `python3 scripts/make-assets.py ../snook-legend` |

The Microsoft Store link is a search for now. Once the product page's address is at
hand (`https://apps.microsoft.com/detail/<id>`), put it in `MS_STORE_URL`, or set
`NEXT_PUBLIC_MS_STORE_URL` when building.

A new language: copy `src/i18n/en.ts`, translate it, add it to `LOCALES` and
`LOCALE_INFO` in `src/i18n/index.ts` and to `generateStaticParams` in
`src/app/[lang]/layout.tsx`, and add its screenshots to `public/shots/<code>/`.

## Stack

[Next.js](https://nextjs.org) 16 (App Router, static export), React 19,
TypeScript, [Tailwind CSS](https://tailwindcss.com) 4,
[Lucide](https://lucide.dev) icons and Vercel Web Analytics. Fonts: Bricolage Grotesque, Geist and Geist Mono.

## License

[MIT](LICENSE). The screenshots and art come from the game's repository.
