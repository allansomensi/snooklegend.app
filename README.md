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

**GitHub Pages** (set up in `.github/workflows/deploy.yml`):

1. Repository Settings → Pages → Source: **GitHub Actions**.
2. Settings → Pages → Custom domain: `snooklegend.app` (the file `public/CNAME`
   already says so), then **Enforce HTTPS**.
3. At the domain's DNS provider, point the apex domain at GitHub Pages:
   `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and
   `185.199.111.153` (and `AAAA` records to `2606:50c0:8000::153` through
   `2606:50c0:8003::153`).

Every push to `main` deploys; the site is also rebuilt daily so that the version
and checksums follow new releases. To rebuild the moment a version is published,
the game's release workflow can send a `repository_dispatch` with the event type
`game-released` to this repository.

**Vercel, Netlify or Cloudflare Pages** work too: build command `npm run build`,
output folder `out`.

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
TypeScript, [Tailwind CSS](https://tailwindcss.com) 4 and
[Lucide](https://lucide.dev) icons. Fonts: Bricolage Grotesque, Geist and Geist Mono.

## License

[MIT](LICENSE). The screenshots and art come from the game's repository.
