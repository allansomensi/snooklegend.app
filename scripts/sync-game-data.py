"""Copies what the site shows of the game from the game's repository.

    python3 scripts/sync-game-data.py ../snook-legend

- The rules, as the game shows them (crates/client/rules/{brazilian,official}/
  {en,pt-BR,es}.md), to src/content/rules/: the rules guide is made of them.
- The profile pictures (crates/client/assets/avatars.png), one file each, to
  public/avatars/<code>.webp.
- src/lib/game-data.ts: the pictures' codes (AVATARS, RETIRED_AVATARS in
  crates/proto/src/lib.rs), the cues and the frames of the shop
  (crates/proto/src/shop.rs) and the achievements
  (crates/proto/src/achievements.rs), with their names in Portuguese and
  Spanish from the game's own translations (crates/client/lang/).

Run it again when the game adds any of these. Needs Pillow (pip install pillow).
"""
import json, os, re, shutil, sys
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else '../snook-legend'
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LANGS = {'en': 'en', 'pt': 'pt-BR', 'es': 'es'}

# The rules
out = os.path.join(ROOT, 'src', 'content', 'rules')
os.makedirs(out, exist_ok=True)
for rules in ('brazilian', 'official'):
    for site, game in LANGS.items():
        shutil.copyfile(f'{SRC}/crates/client/rules/{rules}/{game}.md', f'{out}/{rules}.{site}.md')

def read(p):
    with open(f'{SRC}/{p}', encoding='utf8') as f:
        return f.read()

def translations(game):
    t = {}
    for line in read(f'crates/client/lang/{game}.txt').splitlines():
        if '\t' in line and not line.startswith('#'):
            k, v = line.split('\t', 1)
            t[k] = v
    return t

TR = {site: translations(game) for site, game in LANGS.items() if site != 'en'}

def names(en):
    return {'en': en, **{site: TR[site].get(en, en) for site in TR}}

lib = read('crates/proto/src/lib.rs')
avatars = re.findall(r'"(pic_\w+)"', re.search(r'pub const AVATARS[^=]*=\s*\[(.*?)\];', lib, re.S).group(1))
retired = dict(re.findall(r'\("(\w+)",\s*"(pic_\w+)"\)', re.search(r'pub const RETIRED_AVATARS[^=]*=\s*\[(.*?)\];', lib, re.S).group(1)))

shop = read('crates/proto/src/shop.rs')
rgb = r'\[(\d+),\s*(\d+),\s*(\d+)\]'
hexc = lambda m: '#%02x%02x%02x' % tuple(int(x) for x in m)
cues = {}
for m in re.finditer(r'\b(cue|cue_carbon)\(\s*"(\w+)",\s*"([^"]+)",\s*[^\[]*?' + rgb + r',\s*' + rgb + r',\s*' + rgb, shop, re.S):
    kind, code, name = m.group(1), m.group(2), m.group(3)
    g = m.groups()[3:]
    cues[code] = {'name': names(name), 'butt': hexc(g[0:3]), 'accent': hexc(g[3:6]), 'ring': hexc(g[6:9]),
                  'carbon': kind == 'cue_carbon'}
frames = {}
for m in re.finditer(r'\bframe\(\s*"(\w+)",\s*"([^"]+)",\s*[^\[]*?' + rgb + r',\s*' + rgb + r',\s*(true|false)\)', shop, re.S):
    g = m.groups()
    frames[g[0]] = {'name': names(g[1]), 'a': hexc(g[2:5]), 'b': hexc(g[5:8]), 'shine': g[8] == 'true'}

ach = read('crates/proto/src/achievements.rs')
body = re.search(r'pub const ACHIEVEMENTS: &\[Achievement\] = &\[(.*?)\n\];', ach, re.S).group(1)
achievements = {}
def args(text):
    """The top-level arguments of a call (strings unquoted)."""
    out, depth, cur, q = [], 0, '', False
    for i, ch in enumerate(text):
        if q:
            cur += ch
            if ch == '"' and text[i - 1] != '\\':
                q = False
        elif ch == '"':
            q = True
            cur += ch
        elif ch in '([':
            depth += 1
            cur += ch
        elif ch in ')]':
            if depth == 0:
                break
            depth -= 1
            cur += ch
        elif ch == ',' and depth == 0:
            out.append(cur.strip())
            cur = ''
        else:
            cur += ch
    if cur.strip():
        out.append(cur.strip())
    return [json.loads(a) if a.startswith('"') else a for a in out]
for m in re.finditer(r'(?<![\w:])a\(', body):
    code, title, desc, _stat, _goal, level = args(body[m.end():])
    level = 4 if level == 'RUBY' else int(level)
    achievements[code] = {'name': names(title), 'description': names(desc), 'medal': ['bronze', 'silver', 'gold', 'diamond', 'ruby'][level]}

# The profile pictures: one small file each (the atlas has them 8 a row, 128 pixels each).
atlas = Image.open(f'{SRC}/crates/client/assets/avatars.png').convert('RGBA')
os.makedirs(os.path.join(ROOT, 'public', 'avatars'), exist_ok=True)
for i, code in enumerate(avatars):
    x, y = (i % 8) * 128, (i // 8) * 128
    atlas.crop((x, y, x + 128, y + 128)).save(os.path.join(ROOT, 'public', 'avatars', f'{code}.webp'), 'WEBP', quality=86, method=6)

assert len(avatars) == 64 and len(cues) > 20 and len(frames) > 5 and len(achievements) >= 50, (len(avatars), len(cues), len(frames), len(achievements))

def ts(v):
    return json.dumps(v, ensure_ascii=False, indent=2)

with open(os.path.join(ROOT, 'src', 'lib', 'game-data.ts'), 'w', encoding='utf8') as f:
    f.write(f'''// Made by scripts/sync-game-data.py from the game's repository: don't edit by hand.
/* eslint-disable */

type Names = {{ en: string; pt: string; es: string }};

/** The profile pictures (public/avatars/<code>.webp). */
export const AVATARS: readonly string[] = {ts(avatars)};

/** Faces the pictures once had, each shown as one of today's pictures. */
export const RETIRED_AVATARS: Record<string, string> = {ts(retired)};

/** The cues of the shop: their names and colours. */
export const CUES: Record<string, {{ name: Names; butt: string; accent: string; ring: string; carbon: boolean }}> = {ts(cues)};

/** The frames of the shop (around a player's name card). */
export const FRAMES: Record<string, {{ name: Names; a: string; b: string; shine: boolean }}> = {ts(frames)};

/** The achievements: names, descriptions and medals. */
export const ACHIEVEMENTS: Record<string, {{ name: Names; description: Names; medal: "bronze" | "silver" | "gold" | "diamond" | "ruby" }}> = {ts(achievements)};
''')
print('ok', len(avatars), 'pictures,', len(cues), 'cues,', len(frames), 'frames,', len(achievements), 'achievements')
