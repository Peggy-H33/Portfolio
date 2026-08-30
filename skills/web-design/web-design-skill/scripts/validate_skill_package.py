#!/usr/bin/env python3
"""Validate this skill's required structure and internal links."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


REQUIRED = [
    "SKILL.md",
    "agents/openai.yaml",
    "references/workflow-index.md",
    "references/font-pairings.yaml",
    "references/color-recipes.yaml",
    "references/layout-patterns.yaml",
    "references/media-plan.schema.json",
    "references/page-plan.schema.json",
    "references/skill-integration-contract.md",
    "references/visual-finish-gate.md",
    "assets/font-lab.html",
    "assets/starter/index.html",
    "assets/starter/styles.css",
    "assets/starter/script.js",
    "scripts/create_study_packet.py",
    "scripts/validate_output.py",
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("skill", type=Path, nargs="?", default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.skill.resolve()
    errors: list[str] = []

    for relative in REQUIRED:
        if not (root / relative).is_file():
            errors.append(f"missing {relative}")

    skill_path = root / "SKILL.md"
    text = skill_path.read_text(encoding="utf-8") if skill_path.is_file() else ""
    if not text.startswith("---\n"):
        errors.append("SKILL.md frontmatter missing")
    if "TODO" in text:
        errors.append("SKILL.md contains TODO")
    for link in re.findall(r"\[[^\]]+\]\(([^)]+)\)", text):
        if "://" in link or link.startswith("#"):
            continue
        target = (root / link).resolve()
        if not target.exists():
            errors.append(f"broken SKILL.md link: {link}")

    modules = sorted((root / "references" / "modules").glob("*.md"))
    if len(modules) != 11:
        errors.append(f"expected 11 module references, found {len(modules)}")
    study_templates = sorted((root / "assets" / "study-packet").glob("*"))
    if len([item for item in study_templates if item.is_file()]) < 12:
        errors.append("study packet incomplete")

    for relative in ("references/media-plan.schema.json", "references/page-plan.schema.json", "assets/study-packet/media-plan.json", "assets/study-packet/page-plan.json"):
        path = root / relative
        if path.is_file():
            try:
                json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                errors.append(f"invalid JSON {relative}: {exc}")

    starter_html = (root / "assets/starter/index.html").read_text(encoding="utf-8") if (root / "assets/starter/index.html").is_file() else ""
    starter_css = (root / "assets/starter/styles.css").read_text(encoding="utf-8") if (root / "assets/starter/styles.css").is_file() else ""
    font_lab = (root / "assets/font-lab.html").read_text(encoding="utf-8") if (root / "assets/font-lab.html").is_file() else ""
    if len(set(re.findall(r"src=[\"']media/([^\"']+\.mp4)[\"']", starter_html))) < 3:
        errors.append("starter must reference at least three distinct MP4 assets")
    if "capability-proof" in starter_html or "proof-panel" in starter_html:
        errors.append("starter contains a default proof overlay")
    if "prefers-reduced-motion" not in starter_css:
        errors.append("starter lacks reduced-motion CSS")
    if re.search(r"transition\s*:\s*all\b", starter_css, re.I):
        errors.append("starter uses transition: all")
    if 'data-hero-mode="cinematic-full-bleed"' not in starter_html:
        errors.append("starter lacks cinematic full-bleed Hero marker")
    if "data-hero-media" not in starter_html:
        errors.append("starter lacks data-hero-media marker")
    if not re.search(r"\.hero-media\s*\{[^}]*inset\s*:\s*0", starter_css, re.S):
        errors.append("starter Hero media is not full-bleed")
    for token in ("--type-hero", "--type-section", "--type-quote", "--type-accent", "--type-reading", "--type-utility"):
        if token not in starter_css:
            errors.append(f"starter lacks per-surface typography token {token}")
    if "data-type-surface" not in starter_html:
        errors.append("starter visible text is not marked for typography coverage")
    fixed_defaults = ("Instrument Serif", "Manrope", "Barlow Condensed", "Archivo Black", "fonts.googleapis.com")
    for family in fixed_defaults:
        if family.lower() in (starter_css + font_lab).lower():
            errors.append(f"starter/font lab preselects a concrete font family or provider: {family}")
    if "motion-site-art-directed-v9" not in text or "motion-site-chinese-web-design-v6" not in text:
        errors.append("SKILL.md does not declare the V9/V6 integration")

    for error in errors:
        print(f"ERROR {error}")
    if errors:
        print(f"FAIL errors={len(errors)}")
        return 1
    print(f"PASS modules={len(modules)} study_templates={len(study_templates)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
