"""Generates the placeholder photos in public/samples and data/samples.json.

These stand in for camera-roll photos in the demo zine and the look previews.
Run: python3 scripts/gen-samples.py
"""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

rng = np.random.default_rng(7)


def grad(w, h, top, bottom):
    t = np.linspace(0, 1, h)[:, None, None]
    a = np.array(top, float)[None, None, :]
    b = np.array(bottom, float)[None, None, :]
    return np.repeat(a + (b - a) * t, w, axis=1)


def finish(arr_or_img, grain=3):
    img = arr_or_img if isinstance(arr_or_img, Image.Image) else Image.fromarray(np.clip(arr_or_img, 0, 255).astype("uint8"))
    a = np.asarray(img).astype(float)
    a += rng.normal(0, grain, a.shape[:2])[:, :, None]
    return Image.fromarray(np.clip(a, 0, 255).astype("uint8"))


def hills(w=1800, h=1200):
    img = Image.fromarray(grad(w, h, (120, 180, 230), (235, 225, 205)).astype("uint8"))
    d = ImageDraw.Draw(img)
    d.ellipse((w * 0.68, h * 0.12, w * 0.8, h * 0.3), fill=(255, 236, 190))
    for i, col in enumerate([(120, 160, 110), (80, 130, 80), (50, 100, 60)]):
        base = h * (0.55 + i * 0.13)
        xs = np.linspace(0, w, 60)
        ys = base + np.sin(xs / w * (3 + i) * np.pi + i) * h * 0.06
        d.polygon([(0, h)] + list(zip(xs, ys)) + [(w, h)], fill=col)
    return finish(img.filter(ImageFilter.GaussianBlur(1.2)))


def lanterns(w=1200, h=1800):
    img = Image.fromarray(grad(w, h, (18, 22, 48), (60, 36, 40)).astype("uint8"))
    d = ImageDraw.Draw(img)
    for x0 in range(0, w, 260):
        d.rectangle((x0, h * 0.62 - (x0 % 3) * 40, x0 + 220, h), fill=(30, 26, 30))
        for wy in range(int(h * 0.68), h - 80, 120):
            d.rectangle((x0 + 40, wy, x0 + 90, wy + 60), fill=(240, 190, 110))
    glow = Image.new("RGB", (w, h))
    gd = ImageDraw.Draw(glow)
    for row in range(5):
        y = h * (0.12 + row * 0.1)
        for i in range(7):
            x = w * (0.08 + i * 0.14) + (row % 2) * 60
            r = 46 + (i % 3) * 6
            col = [(230, 60, 40), (245, 140, 40), (250, 200, 80)][(i + row) % 3]
            gd.ellipse((x - r * 1.8, y - r * 1.8, x + r * 1.8, y + r * 1.8), fill=tuple(int(c * 0.35) for c in col))
            d.ellipse((x - r, y - r * 1.2, x + r, y + r * 1.2), fill=col)
            d.line((x, y - r * 1.2, x, y - r * 2.2), fill=(90, 70, 60), width=4)
    img = Image.blend(img, Image.composite(glow.filter(ImageFilter.GaussianBlur(40)), img, Image.new("L", (w, h), 140)), 0.5)
    return finish(img, 3)


def facades(w=1200, h=1600):
    img = Image.new("RGB", (w, h), (250, 220, 150))
    d = ImageDraw.Draw(img)
    cols = [(244, 196, 120), (235, 160, 140), (150, 190, 200), (245, 225, 170)]
    x = 0
    for i in range(4):
        bw = w // 4 + (i % 2) * 40
        d.rectangle((x, 0, x + bw, h), fill=cols[i])
        for wy in range(120, h - 200, 260):
            d.rectangle((x + 50, wy, x + bw - 50, wy + 170), fill=(70, 110, 90))
            d.rectangle((x + 60, wy + 10, x + bw - 60, wy + 160), fill=(40, 60, 70))
            d.line((x + bw // 2, wy + 10, x + bw // 2, wy + 160), fill=(70, 110, 90), width=8)
        x += bw
    d.rectangle((0, h - 160, w, h), fill=(170, 150, 130))
    return finish(img)


def market(w=1500, h=1500):
    img = Image.new("RGB", (w, h), (40, 110, 80))
    d = ImageDraw.Draw(img)
    fruit = [(250, 190, 40), (240, 110, 40), (150, 200, 60), (220, 60, 60), (250, 220, 120), (120, 170, 50)]
    cw, ch = w // 3, h // 3
    for cy in range(3):
        for cx in range(3):
            x0, y0 = cx * cw + 18, cy * ch + 18
            d.rounded_rectangle((x0, y0, x0 + cw - 36, y0 + ch - 36), 20, fill=(30, 150, 110))
            col = fruit[(cx + cy * 2) % len(fruit)]
            for j in range(26):
                fx = x0 + 40 + rng.uniform(0, cw - 120)
                fy = y0 + 40 + rng.uniform(0, ch - 120)
                r = rng.uniform(26, 40)
                shade = tuple(int(c * rng.uniform(0.85, 1.05)) for c in col)
                d.ellipse((fx - r, fy - r, fx + r, fy + r), fill=shade)
    return finish(img.filter(ImageFilter.GaussianBlur(0.8)))


def beach(w=1920, h=1080):
    arr = grad(w, h, (150, 205, 240), (240, 240, 230))
    img = Image.fromarray(arr.astype("uint8"))
    d = ImageDraw.Draw(img)
    d.rectangle((0, h * 0.45, w, h * 0.66), fill=(60, 150, 180))
    for i in range(12):
        y = h * 0.47 + i * 18
        d.line((0, y, w, y), fill=(110, 185, 205), width=2)
    d.rectangle((0, h * 0.66, w, h), fill=(236, 214, 170))
    for i, col in enumerate([(240, 90, 60), (250, 200, 60), (60, 140, 210), (240, 90, 60)]):
        cx, cy = w * (0.18 + i * 0.22), h * (0.7 + (i % 2) * 0.06)
        d.line((cx, cy, cx, cy + 180), fill=(90, 70, 60), width=8)
        d.pieslice((cx - 160, cy - 90, cx + 160, cy + 90), 180, 360, fill=col)
        d.pieslice((cx - 160, cy - 90, cx + 160, cy + 90), 225, 270, fill=(255, 250, 240))
        d.pieslice((cx - 160, cy - 90, cx + 160, cy + 90), 315, 340, fill=(255, 250, 240))
    return finish(img)


def trees(w=1200, h=1600):
    img = Image.fromarray(grad(w, h, (170, 210, 150), (90, 130, 70)).astype("uint8"))
    d = ImageDraw.Draw(img)
    d.polygon([(w * 0.42, h * 0.55), (w * 0.58, h * 0.55), (w * 0.95, h), (w * 0.05, h)], fill=(200, 180, 140))
    for x in [0.12, 0.3, 0.7, 0.88]:
        d.rectangle((w * x - 22, h * 0.35, w * x + 22, h * 0.85), fill=(80, 60, 45))
    for _ in range(140):
        cx, cy = rng.uniform(0, w), rng.uniform(0, h * 0.5)
        r = rng.uniform(60, 140)
        g = int(rng.uniform(90, 170))
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(int(g * 0.5), g, int(g * 0.4)))
    return finish(img.filter(ImageFilter.GaussianBlur(2)))


def river(w=1800, h=1200):
    img = Image.fromarray(grad(w, h, (240, 200, 160), (60, 110, 120)).astype("uint8"))
    d = ImageDraw.Draw(img)
    d.rectangle((0, h * 0.38, w, h * 0.46), fill=(70, 90, 80))
    for i, col in enumerate([(220, 70, 60), (60, 120, 200), (240, 190, 60), (40, 150, 120)]):
        bx, by = w * (0.1 + i * 0.22), h * (0.6 + (i % 2) * 0.12)
        d.polygon([(bx, by), (bx + 300, by), (bx + 260, by + 70), (bx + 40, by + 70)], fill=col)
        d.rectangle((bx + 110, by - 70, bx + 200, by), fill=(250, 240, 220))
    for i in range(30):
        y = h * 0.5 + i * 20
        d.line((rng.uniform(0, w * 0.5), y, rng.uniform(w * 0.5, w), y), fill=(110, 150, 150), width=2)
    return finish(img)


def stools(w=1600, h=1200):
    img = Image.new("RGB", (w, h), (150, 150, 145))
    d = ImageDraw.Draw(img)
    for i in range(0, w, 160):
        d.line((i, 0, i - 200, h), fill=(135, 135, 130), width=4)
    for i, (sx, sy) in enumerate([(0.15, 0.3), (0.45, 0.25), (0.72, 0.4), (0.3, 0.62), (0.6, 0.7)]):
        x, y = w * sx, h * sy
        col = (250, 200, 30) if i % 3 else (230, 60, 50)
        d.rectangle((x, y, x + 240, y + 60), fill=col)
        for lx in (x + 10, x + 200):
            d.rectangle((lx, y + 60, lx + 30, y + 220), fill=tuple(int(c * 0.85) for c in col))
    return finish(img)


SCENES = [
    ("lanterns", lanterns, "Minh An, Hoi An", "15.03.26"),
    ("facades", facades, "Minh An, Hoi An", "15.03.26"),
    ("hills", hills, "Cam Thanh, Hoi An", "16.03.26"),
    ("trees", trees, "Cam Thanh, Hoi An", "16.03.26"),
    ("market", market, "Hoi An Market", "17.03.26"),
    ("river", river, "Thu Bon River", "17.03.26"),
    ("beach", beach, "An Bang, Hoi An", "18.03.26"),
    ("stools", stools, "An Hoi, Hoi An", "19.03.26"),
]

out = []
for name, fn, place, date in SCENES:
    img = fn()
    img.save(f"public/samples/{name}.jpg", quality=80)
    g = np.asarray(img.convert("L")).astype(float) / 255
    band = max(1, img.height // 8)
    out.append({
        "id": f"sample:{name}", "file": f"/samples/{name}.jpg", "name": name,
        "width": img.width, "height": img.height,
        "luma": {"top": round(float(g[:band].mean()), 3), "bottom": round(float(g[-band:].mean()), 3)},
        "place": place, "date": date,
    })
json.dump(out, open("data/samples.json", "w"), indent=2)
print("ok", len(out))
