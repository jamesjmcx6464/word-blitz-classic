#!/usr/bin/env python3
"""Generate PWA icons from the in-game amber hex W logo (StartMenu)."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"
FONT_PATH = Path(
    "/usr/share/fonts/truetype/sand-box/google/Outfit/Outfit-VariableFont_wght.ttf"
)

SLATE = (2, 6, 23, 255)  # #020617
AMBER = (245, 158, 11, 255)  # #f59e0b
AMBER_STROKE = (217, 119, 6, 255)  # #d97706, same as the StartMenu logo
LETTER = (15, 23, 42, 255)  # #0f172a
SHADOW = (0, 0, 0, 100)


def load_font(size: int) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(str(FONT_PATH), size=size)
    font.set_variation_by_name("Black")
    return font


def hex_points(cx: float, cy: float, r: float) -> list[tuple[float, float]]:
    pts: list[tuple[float, float]] = []
    for i in range(6):
        angle = math.radians(-90 + i * 60)
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return pts


def draw_icon(size: int, hex_ratio: float) -> Image.Image:
    base = Image.new("RGBA", (size, size), SLATE)
    cx = cy = size / 2
    r = size * hex_ratio / 2
    stroke = max(2, int(round(size * 0.036)))
    pts = hex_points(cx, cy, r)

    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).polygon(
        hex_points(cx, cy + max(2, size * 0.03), r), fill=SHADOW
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(1, size * 0.018)))
    img = Image.alpha_composite(base, shadow)

    # Draw the stroke as a slightly larger hex behind the fill so vertices stay sharp
    hex_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hex_layer)
    hd.polygon(hex_points(cx, cy, r), fill=AMBER_STROKE)
    hd.polygon(hex_points(cx, cy, max(1, r - stroke)), fill=AMBER)
    img = Image.alpha_composite(img, hex_layer)

    # Soft highlight on the upper face, clipped to the hex
    hi = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(hi).ellipse(
        (
            cx - r * 0.85,
            cy - r * 1.15,
            cx + r * 0.85,
            cy - r * 0.05,
        ),
        fill=(255, 237, 160, 70),
    )
    hi = hi.filter(ImageFilter.GaussianBlur(radius=max(1, size * 0.03)))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    ha = ImageChops.multiply(hi.getchannel("A"), mask)
    rch, gch, bch, _ = hi.split()
    hi = Image.merge("RGBA", (rch, gch, bch, ha))
    img = Image.alpha_composite(img, hi)

    draw = ImageDraw.Draw(img)
    font = load_font(int(2 * r * 0.70))
    # Outfit Black W sits a hair high with a middle anchor; nudge down slightly
    draw.text((cx, cy + r * 0.03), "W", font=font, fill=LETTER, anchor="mm")
    return img


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    specs = {
        ICONS / "icon-192.png": (192, 0.82),
        ICONS / "icon-512.png": (512, 0.82),
        ICONS / "icon-512-maskable.png": (512, 0.62),
        PUBLIC / "apple-touch-icon.png": (180, 0.82),
        PUBLIC / "favicon-32.png": (32, 0.88),
    }
    for path, (size, ratio) in specs.items():
        draw_icon(size, ratio).save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({size}x{size})")

    ico = draw_icon(256, 0.88)
    ico_path = PUBLIC / "favicon.ico"
    ico.save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print(f"wrote {ico_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
