#!/usr/bin/env python3
"""Validate the V6 typography-only skill package."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


REQUIRED = [
    "SKILL.md",
    "agents/openai.yaml",
    "references/art-direction-handoff.md",
    "references/display-type-hierarchy.md",
    "references/full-site-typography-coverage.md",
    "references/expressive-distribution.md",
    "references/rich-script-composition.md",
    "references/signature-intent-taxonomy.md",
    "references/chinese-font-library.md",
    "references/font-catalog.yaml",
    "references/typography-module-plan.schema.json",
    "assets/font-library-preview.html",
    "assets/typography-module-plan.example.json",
    "scripts/recommend_module_fonts.py",
    "scripts/download_open_fonts.py",
    "scripts/validate_typography_plan.py",
]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("skill", type=Path, nargs="?", default=Path(__file__).resolve().parents[1])
    root = parser.parse_args().skill.resolve()
    errors: list[str] = []

    for relative in REQUIRED:
        if not (root / relative).is_file():
            errors.append(f"missing {relative}")

    skill_path = root / "SKILL.md"
    text = skill_path.read_text(encoding="utf-8") if skill_path.is_file() else ""
    if "TODO" in text:
        errors.append("SKILL.md contains TODO")
    for link in re.findall(r"\[[^\]]+\]\(([^)]+)\)", text):
        if "://" in link or link.startswith("#"):
            continue
        if not (root / link).resolve().exists():
            errors.append(f"broken SKILL.md link: {link}")

    for relative in ("references/typography-module-plan.schema.json", "assets/typography-module-plan.example.json"):
        path = root / relative
        if path.is_file():
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                errors.append(f"invalid JSON {relative}: {exc}")

    forbidden = ["references/page-architecture.md", "references/media-and-motion.md", "references/page-plan.schema.json", "assets/starter/index.html"]
    for relative in forbidden:
        if (root / relative).exists():
            errors.append(f"typography-only V6 must not own full-page resource: {relative}")

    for error in errors:
        print(f"ERROR {error}")
    if errors:
        print(f"FAIL errors={len(errors)}")
        return 1
    print("PASS typography-only package boundary verified")
    return 0


if __name__ == "__main__":
    sys.exit(main())
