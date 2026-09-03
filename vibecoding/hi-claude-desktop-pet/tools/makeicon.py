#!/usr/bin/env python3
"""Build build/icon.icns from one robot image: cream squircle + robot."""
import argparse
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

PROJECT_ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description="Build a macOS .icns file from one character image.")
parser.add_argument("source_image", type=Path, help="Character image used in the app icon.")
parser.add_argument(
    "--output",
    type=Path,
    default=PROJECT_ROOT / "build" / "icon.icns",
    help="Output .icns path (default: build/icon.icns).",
)
args = parser.parse_args()

SRC = args.source_image.expanduser().resolve()
OUTPUT = args.output.expanduser().resolve()
WHITE, SAT = 234, 22


def flood_bg(white):
    seed = np.zeros_like(white)
    seed[0, :] |= white[0, :]; seed[-1, :] |= white[-1, :]
    seed[:, 0] |= white[:, 0]; seed[:, -1] |= white[:, -1]
    while True:
        g = seed.copy()
        g[1:, :] |= seed[:-1, :]; g[:-1, :] |= seed[1:, :]
        g[:, 1:] |= seed[:, :-1]; g[:, :-1] |= seed[:, 1:]
        g &= white
        if np.array_equal(g, seed):
            return seed
        seed = g


im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(np.int16)
mn, mx = a.min(2), a.max(2)
white = (mn >= WHITE) & ((mx - mn) <= SAT)
alpha = np.where(flood_bg(white), 0, 255).astype(np.uint8)
robot = Image.fromarray(np.dstack([np.asarray(im), alpha]), "RGBA").crop(
    Image.fromarray(alpha).getbbox())

S = 1024
canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(canvas)
margin = 80
d.rounded_rectangle([margin, margin, S - margin, S - margin], radius=200,
                    fill=(251, 243, 236, 255))

box = int(S * 0.60)
scale = min(box / robot.width, box / robot.height)
rw, rh = int(robot.width * scale), int(robot.height * scale)
robot = robot.resize((rw, rh), Image.LANCZOS)
canvas.alpha_composite(robot, ((S - rw) // 2, (S - rh) // 2))

iconset = OUTPUT.parent / "icon.iconset"
iconset.mkdir(parents=True, exist_ok=True)
for sz in [16, 32, 64, 128, 256, 512, 1024]:
    canvas.resize((sz, sz), Image.LANCZOS).save(iconset / f"icon_{sz}x{sz}.png")
# @2x names
pairs = [(16, 32), (32, 64), (128, 256), (256, 512), (512, 1024)]
for base, big in pairs:
    canvas.resize((big, big), Image.LANCZOS).save(iconset / f"icon_{base}x{base}@2x.png")
canvas.resize((32, 32), Image.LANCZOS).save(iconset / "icon_32x32.png")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(["iconutil", "-c", "icns", str(iconset), "-o", str(OUTPUT)], check=True)
print(f"wrote {OUTPUT}")
