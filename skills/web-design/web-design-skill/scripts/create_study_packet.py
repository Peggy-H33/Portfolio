#!/usr/bin/env python3
"""Create durable design-study files inside a website project."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project", type=Path, help="Website project directory")
    parser.add_argument("--force", action="store_true", help="Overwrite existing study templates")
    args = parser.parse_args()

    skill_root = Path(__file__).resolve().parents[1]
    source = skill_root / "assets" / "study-packet"
    target = args.project.resolve() / "study"
    target.mkdir(parents=True, exist_ok=True)

    created = 0
    skipped = 0
    for item in sorted(source.iterdir()):
        if not item.is_file():
            continue
        destination = target / item.name
        if destination.exists() and not args.force:
            skipped += 1
            continue
        shutil.copy2(item, destination)
        created += 1

    print(f"study packet: {target}")
    print(f"created={created} skipped={skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
