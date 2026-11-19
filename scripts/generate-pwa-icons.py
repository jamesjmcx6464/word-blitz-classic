#!/usr/bin/env python3
"""Generate PWA icons from the in-game amber hex W logo (StartMenu).

Also writes a grey/red/white dev set so the installed dev app is distinct
from the live app.
"""
from __future__ import annotations

import math
from pathlib import Path
from typing import NamedTuple

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"
ICONS_DEV = PUBLIC / "icons-dev"
FONT_PATH = Path(
    "/usr/share/fonts/truetype/sand-box/google/Outfit/Outfit-VariableFont_wght.ttf"
)

SLATE = (2, 6, 23, 255)  # #020617
AMBER = (245, 158, 11, 255)  # #f59e0b
AMBER_STROKE = (217, 119, 6, 255)  # #d97706, same as the StartMenu logo
LETTER = (15, 23, 42, 255)  # #0f172a
SHADOW = (0, 0, 0, 100)

# Dev palette: grey background, red hex, white letter
DEV_GREY = (75, 85, 99, 255)  # #4b5563
DEV_RED = (220, 38, 38, 255)  # #dc2626
DEV_RED_STROKE = (153, 27, 27, 255)  # #991b1b
DEV_LETTER = (255, 255, 255, 255)
DEV_HIGHLIGHT = (254, 202, 202, 80)


class Palette(NamedTuple):
    bg: tuple[int, int, int, int]
    hex_fill: tuple[int, int, int, int]
    stroke: tuple[int, int, int, int]
    letter: tuple[int, int, int, int]
    highlight: tuple[int, int, int, int]
    label: str | None = None


PROD_PALETTE = Palette(SLATE, AMBER, AMBER_STROKE, LETTER, (255, 237, 160, 70))
DEV_PALETTE = Palette(
    DEV_GREY, DEV_RED, DEV_RED_STROKE, DEV_LETTER, DEV_HIGHLIGHT, label="DEV"
)


def load_font(size: int, weight: str = "Black") -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(str(FONT_PATH), size=size)
    font.set_variation_by_name(weight)
    return font


def hex_points(cx: float, cy: float, r: float) -> list[tuple[float, float]]:
    pts: list[tuple[float, float]] = []
    for i in range(6):
        angle = math.radians(-90 + i * 60)
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    return pts


def draw_icon(size: int, hex_ratio: float, palette: Palette = PROD_PALETTE) -> Image.Image:
    base = Image.new("RGBA", (size, size), palette.bg)
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
    hd.polygon(hex_points(cx, cy, r), fill=palette.stroke)
    hd.polygon(hex_points(cx, cy, max(1, r - stroke)), fill=palette.hex_fill)
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
        fill=palette.highlight,
    )
    hi = hi.filter(ImageFilter.GaussianBlur(radius=max(1, size * 0.03)))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    ha = ImageChops.multiply(hi.getchannel("A"), mask)
    rch, gch, bch, _ = hi.split()
    hi = Image.merge("RGBA", (rch, gch, bch, ha))
    img = Image.alpha_composite(img, hi)

    draw = ImageDraw.Draw(img)
    if palette.label:
        # Shrink the W slightly and sit a compact label under it, inside the hex
        # so it stays in the maskable safe zone.
        font = load_font(int(2 * r * 0.58))
        label_font = load_font(max(8, int(2 * r * 0.16)), "ExtraBold")
        draw.text((cx, cy - r * 0.10), "W", font=font, fill=palette.letter, anchor="mm")
        draw.text(
            (cx, cy + r * 0.42),
            palette.label,
            font=label_font,
            fill=palette.letter,
            anchor="mm",
        )
    else:
        font = load_font(int(2 * r * 0.70))
        # Outfit Black W sits a hair high with a middle anchor; nudge down slightly
        draw.text((cx, cy + r * 0.03), "W", font=font, fill=palette.letter, anchor="mm")
    return img


def write_set(
    palette: Palette,
    icon_dir: Path,
    apple_name: str,
    include_favicon: bool,
) -> None:
    icon_dir.mkdir(parents=True, exist_ok=True)
    specs = {
        icon_dir / "icon-192.png": (192, 0.82),
        icon_dir / "icon-512.png": (512, 0.82),
        icon_dir / "icon-512-maskable.png": (512, 0.62),
        PUBLIC / apple_name: (180, 0.82),
    }
    if include_favicon:
        specs[PUBLIC / "favicon-32.png"] = (32, 0.88)
    for path, (size, ratio) in specs.items():
        draw_icon(size, ratio, palette).save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({size}x{size})")

    if include_favicon:
        ico = draw_icon(256, 0.88, palette)
        ico_path = PUBLIC / "favicon.ico"
        ico.save(
            ico_path,
            format="ICO",
            sizes=[(16, 16), (32, 32), (48, 48)],
        )
        print(f"wrote {ico_path.relative_to(ROOT)}")


def main() -> None:
    write_set(PROD_PALETTE, ICONS, "apple-touch-icon.png", include_favicon=True)
    write_set(DEV_PALETTE, ICONS_DEV, "apple-touch-icon-dev.png", include_favicon=False)


if __name__ == "__main__":
    main()
