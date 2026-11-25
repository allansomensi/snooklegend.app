// A stand-in for the game server's public API, serving the test fixtures
// (src/lib/fixtures), to work on the site's pages without the server:
//
//     node scripts/mock-api.mjs            # on http://localhost:7878
//     NEXT_PUBLIC_API_URL=http://localhost:7878 npm run dev
//
// Players: ana (VIP) and bob; tournaments 42 (a finished knockout), 43 (an
// arena) and 44 (a knockout being played). Anything else is a 404.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const dir = new URL("../src/lib/fixtures/", import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(f, dir), "utf8"));
const port = Number(process.env.PORT || 7878);

function answer(path) {
  let m;
  if ((m = path.match(/^\/api\/players\/([^/]+)$/))) {
    const name = decodeURIComponent(m[1]).toLowerCase();
    return ["ana", "bob"].includes(name) ? read(`player-${name}.json`) : null;
  }
  if (path === "/api/tournaments") return read("tournaments.json");
  if ((m = path.match(/^\/api\/tournaments\/(\d+)$/))) {
    return ["42", "43", "44"].includes(m[1]) ? read(`tournament-${m[1]}.json`) : null;
  }
  if (path === "/api/supporters") return read("supporters.json");
  if (path === "/api/leaderboard") {
    const ana = read("player-ana.json");
    return [
      { rank: 1, username: "diego", rating: 1890, games: 300, wins: 200, country: "AR" },
      { rank: 2, username: "ana", rating: ana.ratings[0].rating, games: 120, wins: 70, country: "BR", vip: true },
      { rank: 3, username: "bob", rating: 1188, games: 9, wins: 3, country: "PT", admin: true },
    ];
  }
  return null;
}

createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const body = answer(url.pathname);
  res.writeHead(body ? 200 : 404, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=60",
  });
  res.end(JSON.stringify(body ?? { error: "not found" }));
}).listen(port, () => console.log(`mock API on http://localhost:${port}`));
