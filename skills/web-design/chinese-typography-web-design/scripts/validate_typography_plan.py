#!/usr/bin/env python3
"""Validate V6 ownership locks, rich-script distribution, and local geometry evidence."""

from __future__ import annotations

import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


EXPRESSIVE = {"calligraphic", "handwritten", "rounded-playful", "impact-display", "pixel-mono"}
SCRIPT = {"calligraphic", "handwritten"}
SCRIPT_TERMS = ("花体", "手写", "行草", "草书", "行书", "书法", "毛笔", "题字", "签名字", "签名感", "作者性", "书写感")
NEGATIVE_SCRIPT_TERMS = ("不要花体", "不要手写", "禁用花体", "禁用手写")
DISTRIBUTED_TERMS = ("全站花体", "不只hero", "不只首页", "其他页面", "非大标题", "多处花体", "分布式", "其他部分也用花体")
RICH_SCRIPT_TERMS = ("丰富使用花体", "丰富花体", "多种花体", "花体字丰富", "全页花体", "各处花体", "花体丰富")
SIGNATURE_MODULES = {"brand_mark", "hero_display", "editorial_quote"}
LARGE_TITLE_MODULES = {"hero_display", "section_heading"}
ALLOWED_CHANGES = {
    "font_files", "font_tokens", "font_metrics", "text_color_tokens",
    "line_break_proposals", "fallbacks", "font_loading",
    "copy_zone_width", "local_grid_span", "local_alignment", "section_padding", "section_min_height",
}
ALLOWED_GEOMETRY_CHANGES = {
    "copy_zone_width", "local_grid_span", "local_alignment", "section_padding",
    "section_min_height", "headline_max_width", "explicit_line_breaks",
}
VAGUE_REJECTIONS = ("太中国", "太活泼", "太书法", "不够稳", "不够高级", "不够现代")
EVIDENCE_TERMS = ("字形", "笔画", "断行", "背景", "对比", "主题", "授权", "缺字", "清晰", "媒体", "实拍", "截图")
HIGH_IMPACT_PRIORITIES = {"signature", "support-display"}
IGNORED_TEXT_TAGS = {"head", "script", "style", "template", "noscript"}
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class VisibleTextSurfaceParser(HTMLParser):
    """Collect visible text and the nearest data-type-surface ancestor."""

    def __init__(self, marker: str) -> None:
        super().__init__(convert_charrefs=True)
        self.marker = marker
        self.stack: list[dict[str, object]] = []
        self.surface_ids: set[str] = set()
        self.surface_counts: dict[str, int] = {}
        self.unmarked_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = dict(attrs)
        classes = set((attr_map.get("class") or "").split())
        parent_ignored = bool(self.stack and self.stack[-1]["ignored"])
        ignored = parent_ignored or tag in IGNORED_TEXT_TAGS or "visually-hidden" in classes or "hidden" in attr_map
        surface = attr_map.get(self.marker)
        if surface and not ignored:
            self.surface_ids.add(surface)
            self.surface_counts[surface] = self.surface_counts.get(surface, 0) + 1
        if tag not in VOID_TAGS:
            self.stack.append({"tag": tag, "surface": surface, "ignored": ignored})

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["tag"] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data: str) -> None:
        text = " ".join(data.split())
        if not text or not self.stack or self.stack[-1]["ignored"]:
            return
        surface = next((entry["surface"] for entry in reversed(self.stack) if entry["surface"]), None)
        if surface is None:
            self.unmarked_text.append(text[:80])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("plan", type=Path)
    parser.add_argument("--html", type=Path, help="Host HTML used to prove full-page visible-text coverage")
    args = parser.parse_args()
    errors: list[str] = []
    warnings: list[str] = []

    try:
        data = json.loads(args.plan.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERROR invalid plan JSON: {exc}")
        return 2

    if data.get("schema_version") != "6.0":
        errors.append("schema_version must be 6.0")

    integration = data.get("integration_contract")
    if not isinstance(integration, dict):
        errors.append("integration_contract missing")
        integration = {}
    for lock in ("layout_locked", "media_locked", "section_structure_locked", "art_direction_locked"):
        if integration.get(lock) is not True:
            errors.append(f"integration_contract must set {lock}=true")
    allowed = integration.get("allowed_changes", [])
    if not isinstance(allowed, list) or len(allowed) < 4:
        errors.append("allowed_changes must declare the typography-only surface")
    elif set(allowed) - ALLOWED_CHANGES:
        errors.append("allowed_changes contains non-typography mutations: " + ", ".join(sorted(set(allowed) - ALLOWED_CHANGES)))
    applied = integration.get("applied_out_of_scope_changes")
    if applied != []:
        errors.append("applied_out_of_scope_changes must be an empty array")

    hierarchy = data.get("global_hierarchy")
    if not isinstance(hierarchy, dict):
        errors.append("global_hierarchy missing")
        hierarchy = {}
    signature_module = hierarchy.get("signature_module")
    signature_font = hierarchy.get("signature_font_id")
    signature_category = hierarchy.get("signature_style_category")
    signature_intent = hierarchy.get("signature_intent")
    script_required = hierarchy.get("script_signature_required")
    rich_script_required = hierarchy.get("rich_script_required")
    if signature_intent not in {"script-floral", "expressive-display", "restrained"}:
        errors.append("signature_intent missing or invalid")
    if not isinstance(script_required, bool):
        errors.append("script_signature_required must be boolean")
    if not isinstance(rich_script_required, bool):
        errors.append("rich_script_required must be boolean")
    if rich_script_required is True and script_required is not True:
        errors.append("rich_script_required=true requires script_signature_required=true")
    if script_required is True and signature_intent != "script-floral":
        errors.append("script_signature_required=true requires signature_intent=script-floral")
    if signature_intent == "script-floral" and script_required is not True:
        errors.append("signature_intent=script-floral requires script_signature_required=true")
    if signature_module not in SIGNATURE_MODULES:
        errors.append("signature_module must be brand_mark, hero_display, or editorial_quote")
    if hierarchy.get("signature_coverage") not in {"full-primary-phrase", "core-phrase"}:
        errors.append("signature_coverage cannot be a small emphasis-only treatment")
    if hierarchy.get("expressive_required") is True and signature_category not in EXPRESSIVE:
        errors.append("expressive_required plan selected a neutral/non-signature style category")
    if script_required is True and signature_category not in SCRIPT:
        errors.append("explicit floral/script intent must select calligraphic or handwritten; poster, rounded, pixel, and neutral fonts do not qualify")
    if hierarchy.get("first_visual_language") not in {"Chinese", "balanced", "Latin-user-required"}:
        errors.append("first_visual_language missing or invalid")

    distribution = data.get("expressive_distribution")
    if not isinstance(distribution, dict):
        errors.append("expressive_distribution missing")
        distribution = {}
    distribution_mode = distribution.get("mode")
    if distribution_mode not in {"distributed", "concentrated", "restrained"}:
        errors.append("expressive_distribution.mode must be distributed, concentrated, or restrained")
    distribution_lists: dict[str, list[str]] = {}
    for field in (
        "expressive_surface_ids", "non_hero_expressive_surface_ids",
        "reading_protected_surface_ids", "expressive_font_ids", "expressive_module_types",
        "expressive_page_regions",
    ):
        value = distribution.get(field)
        if not isinstance(value, list) or len(value) != len(set(value)):
            errors.append(f"expressive_distribution.{field} must be a unique array")
            value = []
        distribution_lists[field] = value
    expressive_surfaces = distribution_lists["expressive_surface_ids"]
    non_hero_expressive = distribution_lists["non_hero_expressive_surface_ids"]
    reading_protected = distribution_lists["reading_protected_surface_ids"]
    expressive_font_ids = distribution_lists["expressive_font_ids"]
    expressive_module_types = distribution_lists["expressive_module_types"]
    expressive_page_regions = distribution_lists["expressive_page_regions"]
    minimum_non_hero = distribution.get("min_non_hero_expressive_surfaces")
    max_active_families = distribution.get("max_active_families")
    if not isinstance(minimum_non_hero, int) or minimum_non_hero < 0:
        errors.append("min_non_hero_expressive_surfaces must be a non-negative integer")
        minimum_non_hero = 0
    if not isinstance(max_active_families, int) or not 1 <= max_active_families <= 6:
        errors.append("max_active_families must be an integer from 1 to 6")
        max_active_families = 6
    if not set(non_hero_expressive).issubset(set(expressive_surfaces)):
        errors.append("non_hero_expressive_surface_ids must be a subset of expressive_surface_ids")
    if set(reading_protected) & set(expressive_surfaces):
        errors.append("reading-protected and expressive surface IDs must not overlap")
    if distribution_mode == "distributed":
        if minimum_non_hero < 2:
            errors.append("distributed mode requires min_non_hero_expressive_surfaces >= 2")
        if len(non_hero_expressive) < minimum_non_hero:
            errors.append("distributed mode does not provide the declared number of non-Hero expressive surfaces")
        if len(expressive_surfaces) < 3:
            errors.append("distributed mode requires at least three expressive surfaces in total")

    coverage = data.get("coverage_audit")
    if not isinstance(coverage, dict):
        errors.append("coverage_audit missing")
        coverage = {}
    scope = coverage.get("scope")
    marker = coverage.get("dom_marker_attribute")
    visible_surfaces = coverage.get("visible_text_surface_ids", [])
    covered_surfaces = coverage.get("covered_text_surface_ids", [])
    uncovered_surfaces = coverage.get("uncovered_text_surface_ids", [])
    if scope not in {"full-page", "component"}:
        errors.append("coverage_audit.scope must be full-page or component")
    if marker != "data-type-surface":
        errors.append("coverage_audit.dom_marker_attribute must be data-type-surface")
    for field, value in (("visible_text_surface_ids", visible_surfaces), ("covered_text_surface_ids", covered_surfaces)):
        if not isinstance(value, list) or not value or len(value) != len(set(value)):
            errors.append(f"coverage_audit.{field} must be a non-empty unique array")
    if uncovered_surfaces != []:
        errors.append("coverage_audit.uncovered_text_surface_ids must be empty")
    if isinstance(visible_surfaces, list) and isinstance(covered_surfaces, list) and set(visible_surfaces) != set(covered_surfaces):
        errors.append("coverage_audit covered surfaces must exactly match all visible text surfaces")

    if scope == "full-page" and args.html is None:
        errors.append("full-page coverage requires --html so visible text cannot be omitted from the plan")
    if args.html is not None:
        try:
            html_parser = VisibleTextSurfaceParser("data-type-surface")
            html_parser.feed(args.html.read_text(encoding="utf-8"))
        except Exception as exc:
            errors.append(f"cannot audit host HTML: {exc}")
        else:
            if html_parser.unmarked_text:
                errors.append("visible HTML text lacks data-type-surface: " + " | ".join(html_parser.unmarked_text[:8]))
            repeated = sorted(surface for surface, count in html_parser.surface_counts.items() if count > 1)
            if repeated:
                errors.append("every visible text element needs a unique data-type-surface marker; repeated=" + ", ".join(repeated))
            if isinstance(visible_surfaces, list) and set(visible_surfaces) != html_parser.surface_ids:
                missing = sorted(html_parser.surface_ids - set(visible_surfaces))
                stale = sorted(set(visible_surfaces) - html_parser.surface_ids)
                errors.append(f"coverage_audit does not match HTML markers; missing={missing} stale={stale}")

    modules = data.get("modules")
    if not isinstance(modules, list) or not modules:
        errors.append("modules must be a non-empty array")
        modules = []

    preferences = " ".join(str(item) for item in data.get("user_preferences", []))
    explicit_script = any(term in preferences for term in SCRIPT_TERMS) and not any(term in preferences for term in NEGATIVE_SCRIPT_TERMS)
    explicit_distribution = any(term in preferences.lower().replace(" ", "") for term in DISTRIBUTED_TERMS)
    explicit_rich_script = any(term in preferences.lower().replace(" ", "") for term in RICH_SCRIPT_TERMS)
    if explicit_script and script_required is not True:
        errors.append("user_preferences explicitly request floral/script handwriting but script_signature_required is not true")
    if explicit_distribution and distribution_mode != "distributed":
        errors.append("user_preferences require expression beyond Hero but expressive_distribution.mode is not distributed")
    if explicit_rich_script and rich_script_required is not True:
        errors.append("user_preferences request rich floral typography but rich_script_required is not true")

    selected_ids: set[str] = set()
    signature_entries: list[dict] = []
    surface_owners: dict[str, str] = {}
    surface_styles: dict[str, str] = {}
    surface_fonts: dict[str, str] = {}
    surface_priorities: dict[str, str] = {}
    surface_modules: dict[str, str] = {}
    surface_regions: dict[str, set[str]] = {}
    module_types_with_expressive_surfaces: set[str] = set()
    for index, module in enumerate(modules):
        if not isinstance(module, dict):
            errors.append(f"module[{index}] is not an object")
            continue
        label = module.get("module_id", f"module[{index}]")
        font_id = module.get("font_id")
        if isinstance(font_id, str):
            selected_ids.add(font_id)
        else:
            errors.append(f"{label}: font_id missing")
        module_surfaces = module.get("surface_ids")
        if not isinstance(module_surfaces, list) or not module_surfaces or len(module_surfaces) != len(set(module_surfaces)):
            errors.append(f"{label}: surface_ids must be a non-empty unique array")
            module_surfaces = []
        page_regions = module.get("page_regions")
        if not isinstance(page_regions, list) or not page_regions or len(page_regions) != len(set(page_regions)):
            errors.append(f"{label}: page_regions must be a non-empty unique array")
            page_regions = []
        for surface in module_surfaces:
            if surface in surface_owners:
                errors.append(f"surface {surface} is owned by both {surface_owners[surface]} and {label}")
            else:
                surface_owners[surface] = str(label)
                surface_styles[surface] = str(module.get("style_category", ""))
                surface_fonts[surface] = str(font_id or "")
                surface_priorities[surface] = str(module.get("visual_priority", ""))
                surface_modules[surface] = str(label)
                surface_regions[surface] = {str(region) for region in page_regions}
        if module.get("layout_change_required") is not False:
            errors.append(f"{label}: layout_change_required must be false")
        if module.get("media_change_required") is not False:
            errors.append(f"{label}: media_change_required must be false")
        geometry = module.get("geometry_adjustments")
        if not isinstance(geometry, dict):
            errors.append(f"{label}: geometry_adjustments missing")
        else:
            state = geometry.get("state")
            changes = geometry.get("changes")
            evidence = str(geometry.get("evidence", ""))
            if state not in {"unchanged", "approved"}:
                errors.append(f"{label}: geometry_adjustments.state must be unchanged or approved")
            if not isinstance(changes, list) or len(changes) != len(set(changes)) or set(changes) - ALLOWED_GEOMETRY_CHANGES:
                errors.append(f"{label}: geometry_adjustments.changes contains invalid or duplicate values")
                changes = []
            if state == "unchanged" and changes:
                errors.append(f"{label}: unchanged geometry must not declare changes")
            if state == "approved" and not changes:
                errors.append(f"{label}: approved geometry requires at least one bounded local change")
            if len(evidence) < 12:
                errors.append(f"{label}: geometry_adjustments requires rendered evidence")
        if module.get("font_loaded") is not True or module.get("locale_verified") is not True:
            errors.append(f"{label}: selected font must be loaded and locale-verified")
        license_data = module.get("license", {})
        if not isinstance(license_data, dict) or license_data.get("verified_for_target") is not True:
            errors.append(f"{label}: target license is not verified")
        rejected = module.get("rejected_candidates", [])
        if not isinstance(rejected, list):
            errors.append(f"{label}: rejected_candidates must be an array")
            rejected = []
        if module.get("visual_priority") in HIGH_IMPACT_PRIORITIES and len(rejected) < 2:
            errors.append(f"{label}: signature/support-display modules require at least two rendered rejected candidates")
        if module.get("visual_priority") in HIGH_IMPACT_PRIORITIES:
            line_checks = module.get("line_break_checks")
            if not isinstance(line_checks, dict):
                errors.append(f"{label}: signature/support-display modules require line_break_checks")
            else:
                desktop_lines = line_checks.get("desktop_lines")
                phone_lines = line_checks.get("phone_lines")
                intentional = line_checks.get("single_character_line_intentional")
                if not isinstance(desktop_lines, list) or not desktop_lines or not all(isinstance(line, str) and line.strip() for line in desktop_lines):
                    errors.append(f"{label}: line_break_checks.desktop_lines must be non-empty rendered lines")
                    desktop_lines = []
                if not isinstance(phone_lines, list) or not phone_lines or not all(isinstance(line, str) and line.strip() for line in phone_lines):
                    errors.append(f"{label}: line_break_checks.phone_lines must be non-empty rendered lines")
                    phone_lines = []
                for fit_name in ("desktop_fit", "phone_fit"):
                    fit = line_checks.get(fit_name)
                    if not isinstance(fit, dict):
                        errors.append(f"{label}: line_break_checks.{fit_name} missing")
                        continue
                    surface_id = fit.get("surface_id")
                    viewport = fit.get("viewport_width_px")
                    available = fit.get("available_width_px")
                    measured = fit.get("longest_line_width_px")
                    ratio = fit.get("ratio")
                    if surface_id not in module_surfaces:
                        errors.append(f"{label}: {fit_name}.surface_id must belong to this module")
                    if not all(isinstance(value, (int, float)) for value in (viewport, available, measured, ratio)):
                        errors.append(f"{label}: {fit_name} requires numeric viewport, available width, line width, and ratio")
                        continue
                    if viewport <= 0 or available <= 0 or measured < 0:
                        errors.append(f"{label}: {fit_name} contains non-positive dimensions")
                        continue
                    actual_ratio = measured / available
                    if measured > available:
                        errors.append(f"{label}: {fit_name} longest line {measured}px exceeds {available}px container")
                    if not 0 <= ratio <= 1 or abs(ratio - actual_ratio) > 0.02:
                        errors.append(f"{label}: {fit_name}.ratio must match measured/available within 0.02")
                if len(str(line_checks.get("measurement_method", ""))) < 20:
                    errors.append(f"{label}: line_break_checks.measurement_method must identify the final font bytes and container")
                all_lines = [line.strip() for line in desktop_lines + phone_lines]
                if line_checks.get("punctuation_only_line") is not False or any(re.fullmatch(r"[\W_]+", line) for line in all_lines):
                    errors.append(f"{label}: punctuation-only display lines are forbidden")
                single_han = [line for line in all_lines if re.fullmatch(r"[\u3400-\u9fff]", line)]
                if single_han and intentional is not True:
                    errors.append(f"{label}: unintended single-Han display lines detected: {single_han}")
                if intentional is True and len(str(line_checks.get("single_character_reason", ""))) < 16:
                    errors.append(f"{label}: intentional single-character lines require a specific compositional reason")
        if module.get("style_category") in EXPRESSIVE and module.get("visual_priority") in {"reading", "utility"}:
            checks = module.get("legibility_checks")
            required_checks = (
                "tested_css_sizes", "minimum_css_px", "phone_verified", "zoom_200_verified",
                "bright_dark_verified", "fallback_verified", "result",
            )
            if not isinstance(checks, dict) or any(field not in checks for field in required_checks):
                errors.append(f"{label}: expressive reading/utility use requires complete legibility_checks")
            elif (
                not checks.get("tested_css_sizes")
                or not isinstance(checks.get("minimum_css_px"), (int, float))
                or any(checks.get(field) is not True for field in required_checks[2:-1])
                or checks.get("result") != "pass"
            ):
                errors.append(f"{label}: expressive reading/utility legibility_checks must all pass")
        for candidate in rejected:
            if not isinstance(candidate, dict):
                errors.append(f"{label}: rejected candidate is not an object")
                continue
            reason = str(candidate.get("rendered_reason", ""))
            if candidate.get("font_loaded") is not True or not candidate.get("screenshot"):
                errors.append(f"{label}: rejected candidate lacks loaded-font screenshot evidence")
            if any(term in reason for term in VAGUE_REJECTIONS) and not any(term in reason for term in EVIDENCE_TERMS):
                errors.append(f"{label}: vague rejection without rendered evidence: {reason}")
        if module.get("module_id") == signature_module:
            signature_entries.append(module)

    if isinstance(covered_surfaces, list) and set(surface_owners) != set(covered_surfaces):
        missing = sorted(set(covered_surfaces) - set(surface_owners))
        extra = sorted(set(surface_owners) - set(covered_surfaces))
        errors.append(f"module surface ownership must exactly cover coverage_audit; missing={missing} extra={extra}")

    if set(expressive_surfaces) - set(surface_owners):
        errors.append("expressive_distribution references unknown surface IDs: " + ", ".join(sorted(set(expressive_surfaces) - set(surface_owners))))
    if set(reading_protected) - set(surface_owners):
        errors.append("reading_protected_surface_ids reference unknown surface IDs: " + ", ".join(sorted(set(reading_protected) - set(surface_owners))))
    for surface in expressive_surfaces:
        if surface in surface_styles and surface_styles[surface] not in EXPRESSIVE:
            errors.append(f"expressive surface {surface} selected non-expressive style {surface_styles[surface]}")
    for surface in reading_protected:
        if surface in surface_styles and surface_styles[surface] in EXPRESSIVE:
            errors.append(f"reading-protected surface {surface} selected expressive style {surface_styles[surface]}")
    actual_expressive_fonts = {surface_fonts[surface] for surface in expressive_surfaces if surface in surface_fonts}
    if set(expressive_font_ids) != actual_expressive_fonts:
        errors.append(f"expressive_font_ids must exactly match expressive surfaces: expected {sorted(actual_expressive_fonts)}")
    actual_non_hero = {
        surface for surface in expressive_surfaces
        if surface_modules.get(surface) != "hero_display"
    }
    if set(non_hero_expressive) != actual_non_hero:
        errors.append(f"non_hero_expressive_surface_ids must exactly match expressive non-Hero surfaces: expected {sorted(actual_non_hero)}")
    actual_expressive_modules = {surface_modules[surface] for surface in expressive_surfaces if surface in surface_modules}
    if set(expressive_module_types) != actual_expressive_modules:
        errors.append(f"expressive_module_types must exactly match expressive surfaces: expected {sorted(actual_expressive_modules)}")
    actual_non_hero_regions = {
        region
        for surface in actual_non_hero
        for region in surface_regions.get(surface, set())
        if region != "hero"
    }
    if set(expressive_page_regions) != actual_non_hero_regions:
        errors.append(f"expressive_page_regions must exactly match expressive non-Hero regions: expected {sorted(actual_non_hero_regions)}")
    if distribution_mode == "distributed":
        non_large_title = [surface for surface in non_hero_expressive if surface_modules.get(surface) not in LARGE_TITLE_MODULES]
        if not non_large_title:
            errors.append("distributed mode requires at least one expressive non-large-title surface such as quote, brand, CTA, nav, badge, caption, or number")
        if script_required is True and not any(surface_styles.get(surface) in SCRIPT for surface in non_hero_expressive):
            errors.append("distributed script-floral mode requires at least one non-Hero calligraphic/handwritten surface")
    if rich_script_required is True:
        rich_script_fonts = {
            surface_fonts[surface] for surface in expressive_surfaces
            if surface_styles.get(surface) in SCRIPT
        }
        if distribution_mode != "distributed":
            errors.append("rich-script mode requires distributed expression")
        if len(actual_non_hero) < 4:
            errors.append("rich-script mode requires at least four non-Hero expressive surfaces")
        if len(rich_script_fonts) < 2:
            errors.append("rich-script mode requires at least two distinct calligraphic/handwritten families")
        if len(actual_expressive_modules) < 3:
            errors.append("rich-script mode requires at least three semantic module types")
        if len(actual_non_hero_regions) < 3:
            errors.append("rich-script mode requires expressive typography in at least three non-Hero page regions")

    if len(signature_entries) != 1:
        errors.append("exactly one module entry must match signature_module")
    else:
        signature = signature_entries[0]
        if signature.get("font_id") != signature_font:
            errors.append("signature_font_id does not match the selected signature module")
        if signature.get("style_category") != signature_category:
            errors.append("signature_style_category does not match the selected signature module")
        if signature.get("visual_priority") != "signature":
            errors.append("signature module visual_priority must be signature")
        candidate_categories = {str(item.get("style_category")) for item in signature.get("rejected_candidates", []) if isinstance(item, dict)}
        candidate_categories.add(str(signature.get("style_category")))
        candidate_script_ids = {
            str(item.get("font_id"))
            for item in signature.get("rejected_candidates", [])
            if isinstance(item, dict) and item.get("style_category") in SCRIPT
        }
        if signature.get("style_category") in SCRIPT:
            candidate_script_ids.add(str(signature.get("font_id")))
        if hierarchy.get("expressive_required") is True:
            expressive_count = len(candidate_categories & EXPRESSIVE)
            if expressive_count < 2:
                errors.append("signature A/B/C must include at least two distinct expressive categories")
        if script_required is True and len(candidate_script_ids) < 2:
            errors.append("script-floral A/B/C must render at least two distinct calligraphic/handwritten font families")

    committed = data.get("committed_font_ids")
    if not isinstance(committed, list):
        errors.append("committed_font_ids must be an array")
    elif set(committed) != selected_ids or len(committed) != len(set(committed)):
        errors.append(f"committed_font_ids must exactly match selected module fonts: expected {sorted(selected_ids)}")
    elif len(committed) > max_active_families:
        errors.append(f"committed_font_ids exceed max_active_families={max_active_families}")

    screenshots = data.get("qa_screenshots")
    if not isinstance(screenshots, list) or len(screenshots) < 2:
        errors.append("at least two typography QA screenshots are required")

    for warning in warnings:
        print(f"WARN  {warning}")
    for error in errors:
        print(f"ERROR {error}")
    if errors:
        print(f"FAIL errors={len(errors)} warnings={len(warnings)}")
        return 1
    print(
        f"PASS modules={len(modules)} surfaces={len(surface_owners)} fonts={len(selected_ids)} "
        f"distribution={distribution_mode} expressive={len(expressive_surfaces)} "
        f"non_hero={len(non_hero_expressive)} rich_script={rich_script_required} "
        f"regions={len(actual_non_hero_regions)} signature={signature_module}:{signature_font}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
