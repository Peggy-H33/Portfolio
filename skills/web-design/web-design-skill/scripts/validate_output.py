#!/usr/bin/env python3
"""Mechanical quality gate for a generated motion website.

The script cannot judge taste. It catches missing study artifacts, single-video
regressions, duplicate media, missing posters/sidecars, common accessibility and
CSS layering mistakes, and unclosed placeholder content.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path


STUDY_FILES = [
    "01-brief-content.md",
    "02-reference-evidence.md",
    "03-typography.md",
    "04-layout.md",
    "05-color.md",
    "06-media.md",
    "07-components.md",
    "08-motion.md",
    "09-responsive-quality.md",
    "media-plan.json",
    "page-plan.json",
    "qa-report.md",
]


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def load_json(path: Path, errors: list[str]) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # concise CLI report
        errors.append(f"invalid JSON: {path}: {exc}")
        return {}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project", type=Path)
    parser.add_argument("--allow-compact", action="store_true", help="Allow an explicit one-video compact page")
    args = parser.parse_args()
    root = args.project.resolve()
    errors: list[str] = []
    warnings: list[str] = []

    if not root.is_dir():
        print(f"ERROR project directory missing: {root}")
        return 2

    study = root / "study"
    for name in STUDY_FILES:
        if not (study / name).is_file():
            errors.append(f"missing study/{name}")

    media_plan_path = study / "media-plan.json"
    plan = load_json(media_plan_path, errors) if media_plan_path.is_file() else {}
    density = plan.get("density")
    assets = plan.get("assets", []) if isinstance(plan.get("assets", []), list) else []
    minimum = 1 if args.allow_compact and density == "compact" else 3
    if len(assets) < minimum:
        errors.append(f"media plan has {len(assets)} assets; expected at least {minimum}")
    if density == "compact" and not args.allow_compact:
        errors.append("compact media density requires --allow-compact and an explicit brief")

    roles = [asset.get("role") for asset in assets if isinstance(asset, dict)]
    if len(set(roles)) < minimum:
        errors.append(f"media plan has {len(set(roles))} distinct narrative roles; expected at least {minimum}")

    hashes: dict[str, str] = {}
    for asset in assets:
        if not isinstance(asset, dict):
            errors.append("media-plan asset is not an object")
            continue
        for field in (
            "id", "role", "video", "poster", "prompt", "subject_specific_reason", "unrelated_brand_substitution_passed", "safe_zone", "focal_points",
            "processing_history", "integration_mode", "focal_target_met", "regeneration_attempts",
        ):
            if field not in asset:
                errors.append(f"media asset missing {field}: {asset.get('id', '<unknown>')}")
        if not isinstance(asset.get("subject_specific_reason"), str) or len(asset.get("subject_specific_reason", "")) < 24:
            errors.append(f"media asset lacks a concrete subject-specific reason: {asset.get('id', '<unknown>')}")
        if asset.get("unrelated_brand_substitution_passed") is not True:
            errors.append(f"media asset has not passed unrelated-brand substitution: {asset.get('id', '<unknown>')}")
        for field in ("video", "poster"):
            relative = asset.get(field)
            if not isinstance(relative, str):
                continue
            path = root / relative
            if not path.is_file():
                errors.append(f"missing media file: {relative}")
            elif field == "video":
                file_hash = digest(path)
                if file_hash in hashes:
                    errors.append(f"duplicate video bytes: {relative} == {hashes[file_hash]}")
                hashes[file_hash] = relative
                sidecar = path.with_suffix(path.suffix + ".json")
                if not sidecar.is_file():
                    errors.append(f"missing video sidecar: {sidecar.relative_to(root)}")

    hero_assets = [asset for asset in assets if isinstance(asset, dict) and asset.get("role") == "hero-atmosphere"]
    if len(hero_assets) != 1:
        errors.append(f"media plan must contain exactly one hero-atmosphere asset; found {len(hero_assets)}")

    html_files = sorted(root.rglob("*.html"))
    css_files = sorted(root.rglob("*.css"))
    js_files = sorted(root.rglob("*.js"))
    if not html_files:
        errors.append("no HTML file found")
    combined_html = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in html_files)
    combined_css = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in css_files)
    combined_js = "\n".join(path.read_text(encoding="utf-8", errors="ignore") for path in js_files)

    html_video_sources = set(re.findall(r"<source[^>]+src=[\"']([^\"']+\.mp4)[\"']", combined_html, re.I))
    if len(html_video_sources) < minimum:
        errors.append(f"HTML references {len(html_video_sources)} distinct MP4 sources; expected at least {minimum}")
    if "poster=" not in combined_html:
        errors.append("video poster attributes missing")
    if "prefers-reduced-motion" not in combined_css:
        errors.append("CSS lacks prefers-reduced-motion")
    if re.search(r"transition\s*:\s*all\b", combined_css, re.I):
        errors.append("CSS uses transition: all")
    if "focus-visible" not in combined_css:
        errors.append("CSS lacks visible focus treatment")
    if "<main" not in combined_html or "<h1" not in combined_html:
        errors.append("semantic main or h1 missing")
    if re.search(r"<(div|span)[^>]+onclick=", combined_html, re.I):
        errors.append("click action attached to div/span")
    if "canplay" in combined_js and "error" not in combined_js:
        warnings.append("video reveal uses canplay without an explicit error fallback")

    for marker in ("REPLACE", "Lorem ipsum", "placeholder"):
        if marker.lower() in (combined_html + combined_css).lower():
            errors.append(f"unresolved placeholder marker: {marker}")

    page_plan_path = study / "page-plan.json"
    page_plan = load_json(page_plan_path, errors) if page_plan_path.is_file() else {}
    hero_contract = page_plan.get("hero_contract", {}) if isinstance(page_plan.get("hero_contract", {}), dict) else {}
    hero_mode = hero_contract.get("mode")
    if not hero_contract:
        errors.append("page plan has no hero_contract")
    else:
        for field in (
            "mode", "locked", "desktop_media_coverage_min", "copy_safe_zone",
            "subject_safe_zone", "interaction_safe_zone", "regeneration_policy",
            "mobile_transformation", "locked_fields",
        ):
            if field not in hero_contract:
                errors.append(f"hero_contract missing {field}")
        if hero_mode == "cinematic-full-bleed":
            if hero_contract.get("locked") is not True:
                errors.append("cinematic-full-bleed hero must be locked")
            coverage = hero_contract.get("desktop_media_coverage_min")
            if not isinstance(coverage, (int, float)) or coverage < 0.9:
                errors.append("cinematic-full-bleed hero requires desktop_media_coverage_min >= 0.9")
            if hero_contract.get("regeneration_policy") != "regenerate-before-layout-change":
                errors.append("full-bleed hero must regenerate a focal miss before changing layout")
            if hero_assets:
                hero_asset = hero_assets[0]
                if hero_asset.get("integration_mode") != "full-bleed":
                    errors.append("cinematic-full-bleed page requires hero asset integration_mode=full-bleed")
                if hero_asset.get("focal_target_met") is not True:
                    errors.append("hero focal target has not passed frame review")
                asset_coverage = hero_asset.get("desktop_media_coverage_target")
                if not isinstance(asset_coverage, (int, float)) or asset_coverage < 0.9:
                    errors.append("hero media plan requires desktop_media_coverage_target >= 0.9")
            if 'data-hero-mode="cinematic-full-bleed"' not in combined_html and "data-hero-mode='cinematic-full-bleed'" not in combined_html:
                errors.append("HTML lacks data-hero-mode=cinematic-full-bleed marker")
            if "data-hero-media" not in combined_html:
                errors.append("HTML lacks data-hero-media marker")
            if not re.search(r"inset\s*:\s*0(?:[;\s}])", combined_css):
                errors.append("full-bleed project CSS lacks an inset: 0 media rule")

    quality = page_plan.get("visual_quality_contract", {}) if isinstance(page_plan.get("visual_quality_contract", {}), dict) else {}
    if not quality:
        errors.append("page plan has no visual_quality_contract")
    else:
        signals = quality.get("hero_subject_signals", [])
        if not isinstance(signals, list) or len(set(signals)) < 2:
            errors.append("visual_quality_contract requires at least two distinct Hero subject signals")
        if quality.get("unrelated_brand_substitution_passed") is not True:
            errors.append("Hero has not passed the unrelated-brand substitution test")
        neutral_share = quality.get("neutral_material_area_target")
        accent_share = quality.get("high_chroma_area_target")
        if not isinstance(neutral_share, (int, float)) or not 0.5 <= neutral_share <= 0.95:
            errors.append("neutral_material_area_target must be between 0.5 and 0.95")
        if not isinstance(accent_share, (int, float)) or not 0 <= accent_share <= 0.3:
            errors.append("high_chroma_area_target must be between 0 and 0.3")
        if quality.get("max_consecutive_accent_dominant_sections") not in {0, 1}:
            errors.append("max_consecutive_accent_dominant_sections must be 0 or 1")
        for field in ("fullpage_desktop_capture", "fullpage_phone_capture"):
            relative = quality.get(field)
            if not isinstance(relative, str) or not (root / relative).is_file():
                errors.append(f"missing visual quality capture: {relative or field}")
        forbidden = quality.get("forbidden_failures", [])
        required_failures = {"generic-hero", "unintended-single-character-line", "multi-screen-flat-accent"}
        if not isinstance(forbidden, list) or not required_failures.issubset(set(forbidden)):
            errors.append("visual_quality_contract does not forbid the known finish failures")

    integration = page_plan.get("integration_contract", {}) if isinstance(page_plan.get("integration_contract", {}), dict) else {}
    if not integration:
        errors.append("page plan has no integration_contract")
    else:
        for lock in ("layout_locked", "media_locked", "section_structure_locked"):
            if integration.get(lock) is not True:
                errors.append(f"integration contract must set {lock}=true")
        if integration.get("art_direction_owner") != "motion-site-art-directed-v9":
            errors.append("integration contract art_direction_owner must be motion-site-art-directed-v9")
        for field in (
            "typography_specialist", "font_selection_owner", "font_family_lock_state", "typography_geometry_state",
            "expressive_distribution", "non_hero_expressive_targets", "reading_protected_targets",
        ):
            if field not in integration:
                errors.append(f"integration contract missing {field}")
        specialist = integration.get("typography_specialist")
        if specialist == "motion-site-chinese-web-design-v6" and integration.get("font_selection_owner") != specialist:
            errors.append("Chinese V6 must own Chinese font-family selection")
        if integration.get("font_family_lock_state") not in {"unlocked-for-typography-lab", "selected-from-rendered-evidence"}:
            errors.append("font_family_lock_state must show that selection was not pre-locked")
        if specialist == "motion-site-chinese-web-design-v6" and integration.get("font_family_lock_state") != "selected-from-rendered-evidence":
            errors.append("final Chinese V6 output must update font_family_lock_state to selected-from-rendered-evidence")
        if specialist == "motion-site-chinese-web-design-v6" and integration.get("typography_geometry_state") != "locked-after-real-glyph-test":
            errors.append("final Chinese V6 output must lock local typography geometry after real-glyph screenshots")

    sections = page_plan.get("sections", []) if isinstance(page_plan.get("sections", []), list) else []
    if not sections:
        errors.append("page plan has no sections")
    all_opportunities: set[str] = set()
    hero_opportunities: set[str] = set()
    all_reading_protected: set[str] = set()
    for section in sections:
        if not isinstance(section, dict):
            continue
        for field in ("purpose", "layout", "alignment", "media_role", "safe_zone", "layers", "responsive", "expressive_type_opportunities", "reading_protected_surfaces"):
            if field not in section:
                errors.append(f"page section missing {field}: {section.get('id', '<unknown>')}")
        opportunities = section.get("expressive_type_opportunities", [])
        protected = section.get("reading_protected_surfaces", [])
        if not isinstance(opportunities, list) or len(opportunities) != len(set(opportunities)):
            errors.append(f"section expressive_type_opportunities must be a unique array: {section.get('id', '<unknown>')}")
            opportunities = []
        if not isinstance(protected, list) or len(protected) != len(set(protected)):
            errors.append(f"section reading_protected_surfaces must be a unique array: {section.get('id', '<unknown>')}")
            protected = []
        all_opportunities.update(str(value) for value in opportunities)
        all_reading_protected.update(str(value) for value in protected)
        if section.get("id") == "hero":
            hero_opportunities.update(str(value) for value in opportunities)
        if section.get("id") == "hero" and hero_mode == "cinematic-full-bleed":
            layout_text = str(section.get("layout", "")).lower()
            if re.search(r"contained|window|cutaway|card|panel|top-right|upper-right|小窗|卡片|右上|下半", layout_text):
                errors.append(f"full-bleed hero layout contains a contained/window pattern: {layout_text}")

    if integration:
        distribution_mode = integration.get("expressive_distribution")
        declared_non_hero = integration.get("non_hero_expressive_targets", [])
        declared_protected = integration.get("reading_protected_targets", [])
        if not isinstance(declared_non_hero, list) or len(declared_non_hero) != len(set(declared_non_hero)):
            errors.append("non_hero_expressive_targets must be a unique array")
            declared_non_hero = []
        if not isinstance(declared_protected, list) or len(declared_protected) != len(set(declared_protected)):
            errors.append("reading_protected_targets must be a unique array")
            declared_protected = []
        possible_non_hero = all_opportunities - hero_opportunities
        if set(declared_non_hero) - possible_non_hero:
            errors.append("non_hero_expressive_targets are not declared by non-Hero sections: " + ", ".join(sorted(set(declared_non_hero) - possible_non_hero)))
        if set(declared_protected) - all_reading_protected:
            errors.append("reading_protected_targets are not declared by sections: " + ", ".join(sorted(set(declared_protected) - all_reading_protected)))
        if distribution_mode == "distributed" and len(declared_non_hero) < 2:
            errors.append("distributed page plan requires at least two non-Hero expressive targets")

        if integration.get("typography_specialist") == "motion-site-chinese-web-design-v6":
            typography_plan_path = study / "typography-module-plan.json"
            if not typography_plan_path.is_file():
                errors.append("Chinese V6 integration requires study/typography-module-plan.json")
            else:
                typography_plan = load_json(typography_plan_path, errors)
                if typography_plan.get("schema_version") != "6.0":
                    errors.append("typography-module-plan schema_version must be 6.0")
                typography_distribution = typography_plan.get("expressive_distribution", {})
                if not isinstance(typography_distribution, dict):
                    errors.append("typography-module-plan lacks expressive_distribution")
                    typography_distribution = {}
                if typography_distribution.get("mode") != distribution_mode:
                    errors.append("page and typography plans disagree on expressive distribution mode")
                typography_non_hero = typography_distribution.get("non_hero_expressive_surface_ids", [])
                if distribution_mode == "distributed" and (not isinstance(typography_non_hero, list) or len(typography_non_hero) < 2):
                    errors.append("Chinese V6 distributed plan requires at least two non-Hero expressive surfaces")
                module_by_surface: dict[str, str] = {}
                for module in typography_plan.get("modules", []):
                    if not isinstance(module, dict):
                        continue
                    if module.get("visual_priority") in {"signature", "support-display"}:
                        line_checks = module.get("line_break_checks")
                        label = str(module.get("module_id", "<unknown>"))
                        if not isinstance(line_checks, dict):
                            errors.append(f"Chinese V6 {label} lacks line_break_checks")
                        else:
                            for fit_name in ("desktop_fit", "phone_fit"):
                                fit = line_checks.get(fit_name)
                                if not isinstance(fit, dict):
                                    errors.append(f"Chinese V6 {label} lacks {fit_name}")
                                    continue
                                available = fit.get("available_width_px")
                                measured = fit.get("longest_line_width_px")
                                if not isinstance(available, (int, float)) or not isinstance(measured, (int, float)) or available <= 0:
                                    errors.append(f"Chinese V6 {label} has invalid {fit_name} dimensions")
                                elif measured > available:
                                    errors.append(f"Chinese V6 {label} {fit_name} line exceeds its final container")
                    for surface in module.get("surface_ids", []):
                        module_by_surface[str(surface)] = str(module.get("module_id", ""))
                if distribution_mode == "distributed" and isinstance(typography_non_hero, list):
                    if not any(module_by_surface.get(str(surface)) not in {"hero_display", "section_heading"} for surface in typography_non_hero):
                        errors.append("Chinese V6 distributed plan requires an expressive non-large-title role")

    for warning in warnings:
        print(f"WARN  {warning}")
    for error in errors:
        print(f"ERROR {error}")
    if errors:
        print(f"FAIL errors={len(errors)} warnings={len(warnings)}")
        return 1
    print(f"PASS videos={len(html_video_sources)} sections={len(sections)} warnings={len(warnings)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
