#!/usr/bin/env python3
"""Cut the white background off each robot jpg -> trimmed transparent PNG.

Strategy: flood-fill the near-white region that is connected to the image
border (so interior whites like a fried egg are preserved), erode 1px to
kill the JPEG halo, autocrop to content, downscale, and record a foot colour
sampled from the body.
"""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description="Convert numbered character JPGs into transparent desktop-pet sprites.")
parser.add_argument("source_dir", type=Path, help="Directory containing 1.jpg, 2.jpg, and so on.")
parser.add_argument(
    "--output-dir",
    type=Path,
    default=PROJECT_ROOT / "assets" / "robot",
    help="Sprite output directory (default: assets/robot).",
)
parser.add_argument("--count", type=int, default=12, help="Number of sequential JPG files to process.")
args = parser.parse_args()

SRC = args.source_dir.expanduser().resolve()
OUT = args.output_dir.expanduser().resolve()
TARGET_H = 60           # output sprite height in px (keeps aspect)
WHITE = 234             # channel >= this counts as "near white"
SAT = 22               # max(channel)-min(channel) <= this -> low saturation
# Images whose robot has NO white worth keeping -> strip every white pixel
# (fixes enclosed background pockets, e.g. the gap under the headphone band).
REMOVE_ALL_WHITE = {5}

OUT.mkdir(parents=True, exist_ok=True)


def flood_background(white):
    """Morphological reconstruction: grow from the border within `white`."""
    seed = np.zeros_like(white)
    seed[0, :] |= white[0, :]
    seed[-1, :] |= white[-1, :]
    seed[:, 0] |= white[:, 0]
    seed[:, -1] |= white[:, -1]
    while True:
        grown = seed.copy()
        grown[1:, :] |= seed[:-1, :]
        grown[:-1, :] |= seed[1:, :]
        grown[:, 1:] |= seed[:, :-1]
        grown[:, :-1] |= seed[:, 1:]
        grown &= white
        if np.array_equal(grown, seed):
            return seed
        seed = grown


def erode(mask):
    e = mask.copy()
    e[1:, :] &= mask[:-1, :]
    e[:-1, :] &= mask[1:, :]
    e[:, 1:] &= mask[:, :-1]
    e[:, :-1] &= mask[:, 1:]
    return e


manifest = []
for i in range(1, args.count + 1):
    source_file = SRC / f"{i}.jpg"
    if not source_file.is_file():
        raise FileNotFoundError(f"Missing source image: {source_file}")
    im = Image.open(source_file).convert("RGB")
    arr = np.asarray(im).astype(np.int16)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    mx = arr.max(axis=2)
    mn = arr.min(axis=2)
    white = (mn >= WHITE) & ((mx - mn) <= SAT)

    bg = white.copy() if i in REMOVE_ALL_WHITE else flood_background(white)
    fg = ~bg
    fg_core = erode(fg)          # 1px in -> removes the grey halo ring
    ring = fg & ~fg_core

    alpha = np.zeros(fg.shape, dtype=np.uint8)
    alpha[fg_core] = 255
    alpha[ring] = 120            # soft edge

    rgba = np.dstack([arr.astype(np.uint8), alpha])
    out = Image.fromarray(rgba, "RGBA")

    # autocrop to the visible content
    bbox = out.getbbox()
    out = out.crop(bbox)

    # downscale to target height
    w, h = out.size
    scale = TARGET_H / h
    out = out.resize((max(1, round(w * scale)), TARGET_H), Image.LANCZOS)

    # sample a foot colour: median of strongly-orange body pixels
    a = np.asarray(out)
    op = a[..., 3] > 200
    rr, gg, bb = a[..., 0], a[..., 1], a[..., 2]
    orange = op & (rr > 120) & (rr > gg) & (gg >= bb) & (rr - bb > 25)
    if orange.sum() > 20:
        fr = int(np.median(rr[orange]))
        fg_ = int(np.median(gg[orange]))
        fb = int(np.median(bb[orange]))
    else:
        fr, fg_, fb = 200, 110, 80
    # darken a touch for the feet
    foot = "#%02x%02x%02x" % (int(fr * 0.82), int(fg_ * 0.82), int(fb * 0.82))

    out.save(OUT / f"{i}.png")
    manifest.append({"file": f"{i}.png", "w": out.size[0], "h": out.size[1], "foot": foot})
    print(f"{i}.jpg -> {i}.png  {out.size}  foot={foot}")

with (OUT / "manifest.json").open("w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
print("wrote manifest.json")
