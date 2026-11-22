"""Makes the site's pictures from the game's repository.

    python3 scripts/make-assets.py ../snook-legend

Reads the store art, the localised screenshots and the emblem, and writes
WebP/PNG files to public/ (hero art, screenshots per language, the opponents'
portraits cut from the opponents screen, icons and the Open Graph picture).
Needs Pillow (pip install pillow). Then copy public/brand/icon-512.png to
src/app/icon.png if the emblem changed.
"""
import os, sys
from PIL import Image, ImageDraw
SRC = sys.argv[1] if len(sys.argv) > 1 else '../snook-legend'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
def mk(p): os.makedirs(p, exist_ok=True)

def webp(im, path, w, q=82):
    im = im.convert('RGB')
    h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(path, 'WEBP', quality=q, method=6)

# Hero art
mk(f'{OUT}/art')
hero = Image.open(f'{SRC}/store-art/hero-3840x2160.png')
for w in (2560, 1600, 960):
    webp(hero, f'{OUT}/art/hero-{w}.webp', w, 78)
# Poster (portrait) for small screens
poster = Image.open(f'{SRC}/store-art/poster-1440x2160.png')
webp(poster, f'{OUT}/art/poster-900.webp', 900, 80)

# Screenshots per locale
shots = ['01-aim','04-hall','02-top','03-elevation','05-opponents','06-lounge','10-drills','08-rules','09-menu','07-pictures']
for loc, d in (('en','en'),('pt','pt-BR'),('es','es')):
    mk(f'{OUT}/shots/{loc}')
    for s in shots:
        im = Image.open(f'{SRC}/store-art/screenshots/{d}/{s}.png')
        webp(im, f'{OUT}/shots/{loc}/{s}-1920.webp', 1920, 84)
        webp(im, f'{OUT}/shots/{loc}/{s}-960.webp', 960, 80)

# Opponent portraits cropped from the opponents screen (1920x1080)
mk(f'{OUT}/opponents')
opp = Image.open(f'{SRC}/store-art/screenshots/en/05-opponents.png').convert('RGBA')
names = ['leo','nina','tito','lola','bruno','ines','marta','otto','diego','rosa','kenji','amara','sofia','yuri','viktor']
xs = [301, 582, 863]; ys = [225, 365, 506, 646, 787]
r = 39
for i, n in enumerate(names):
    cx, cy = xs[i % 3], ys[i // 3]
    crop = opp.crop((cx - r, cy - r, cx + r, cy + r)).resize((156, 156), Image.LANCZOS)
    mask = Image.new('L', (156*4, 156*4), 0)
    ImageDraw.Draw(mask).ellipse((6, 6, 156*4-6, 156*4-6), fill=255)
    mask = mask.resize((156, 156), Image.LANCZOS)
    crop.putalpha(mask)
    crop.save(f'{OUT}/opponents/{n}.webp', 'WEBP', quality=90, method=6)
# Brand icons
mk(f'{OUT}/brand')
icon = Image.open(f'{SRC}/crates/client/assets/icon/snook-legend-1024.png').convert('RGBA')
for s in (512, 256, 192, 128, 64):
    icon.resize((s, s), Image.LANCZOS).save(f'{OUT}/brand/icon-{s}.png', optimize=True)
icon.resize((128, 128), Image.LANCZOS).save(f'{OUT}/brand/icon-128.webp', 'WEBP', quality=90)

# Open Graph image (1200x630) from the titled hero
og = Image.open(f'{SRC}/store-art/xbox-hero-titled-1920x1080.png').convert('RGB').resize((1200, 675), Image.LANCZOS)
og.crop((0, 15, 1200, 645)).save(f'{OUT}/og.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
print('ok')
