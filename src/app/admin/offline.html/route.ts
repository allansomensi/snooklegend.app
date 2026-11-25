// The page the staff portal's service worker shows when there is no
// connection: plain HTML, no scripts (the portal's need a fresh nonce).

export const dynamic = "force-static";

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0e0c0a">
<title>Offline · Snook Legend Staff</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center; background: #0e0c0a; color: #f1e8da;
    font: 16px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 24px; box-sizing: border-box; }
  main { max-width: 26rem; }
  .ball { width: 72px; height: 72px; margin: 0 auto 24px; border-radius: 50%; background: #141414; display: grid; place-items: center;
    box-shadow: 0 0 0 6px #1d6b48; }
  .ball span { width: 34px; height: 34px; border-radius: 50%; background: #f8f3e6; color: #141414; font-weight: 800; display: grid; place-items: center; }
  h1 { font-size: 1.35rem; margin: 0 0 8px; }
  p { margin: 4px 0; color: #b6a894; }
  a { display: inline-block; margin-top: 24px; padding: 12px 22px; border-radius: 999px; background: #e7b955; color: #1b1407;
    font-weight: 700; text-decoration: none; }
  a:focus-visible { outline: 2px solid #f3cf7c; outline-offset: 3px; }
</style>
</head>
<body>
<main>
  <div class="ball" aria-hidden="true"><span>8</span></div>
  <h1>You're offline</h1>
  <p lang="pt-BR">Você está sem conexão.</p>
  <p lang="es">No tienes conexión.</p>
  <p>The staff portal needs the internet: try again once you're connected.</p>
  <a href="/admin/">Try again · Tentar de novo · Reintentar</a>
</main>
</body>
</html>
`;

export function GET() {
  return new Response(HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
