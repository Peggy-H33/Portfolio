#!/usr/bin/env python3
"""Inject and validate the self-contained editable HTML bundle."""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import stat
import sys
import tempfile
from html.parser import HTMLParser
from pathlib import Path


BUNDLE_VERSION = "1.1.0"
BUNDLE_START = "<!-- editable-html:bundle:start -->"
BUNDLE_END = "<!-- editable-html:bundle:end -->"
REQUIRED_IDS = (
    "eh-editor-page-style",
    "eh-editor-template",
    "eh-editor-host",
    "eh-editor-script",
)
REQUIRED_CONTROL_IDS = (
    "eh-toolbar",
    "eh-status",
    "eh-read-mode",
    "eh-edit-mode",
    "eh-block",
    "eh-size",
    "eh-fore-color",
    "eh-back-color",
    "eh-painter",
    "eh-insert-image",
    "eh-image-file",
    "eh-save",
    "eh-print",
    "eh-imagebar",
    "eh-image-smaller",
    "eh-image-bigger",
    "eh-image-delete",
)


class StructureParser(HTMLParser):
    def __init__(self, source: str) -> None:
        super().__init__(convert_charrefs=False)
        self.source = source
        self.line_offsets = [0]
        self.line_offsets.extend(match.end() for match in re.finditer("\n", source))
        self.root_count = 0
        self.body_count = 0
        self.body_starts: list[tuple[int, int]] = []
        self.body_ends: list[tuple[int, int]] = []
        self.ids: dict[str, int] = {}
        self.text_by_id: dict[str, str] = {}
        self._capture: tuple[str, str, list[str]] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._inspect(tag, attrs)
        if tag.lower() == "body":
            self._record_body_start()

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._inspect(tag, attrs)
        if tag.lower() == "body":
            self._record_body_start()

    def handle_endtag(self, tag: str) -> None:
        lowered = tag.lower()
        if self._capture and self._capture[0] == lowered:
            _, element_id, chunks = self._capture
            self.text_by_id[element_id] = "".join(chunks)
            self._capture = None
        if lowered == "body":
            start = self._offset()
            match = re.match(r"</\s*body\s*>", self.source[start:], re.IGNORECASE)
            if match:
                self.body_ends.append((start, start + match.end()))

    def handle_data(self, data: str) -> None:
        if self._capture:
            self._capture[2].append(data)

    def handle_entityref(self, name: str) -> None:
        if self._capture:
            self._capture[2].append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        if self._capture:
            self._capture[2].append(f"&#{name};")

    def _offset(self) -> int:
        line, column = self.getpos()
        return self.line_offsets[line - 1] + column

    def _record_body_start(self) -> None:
        raw = self.get_starttag_text()
        if not raw:
            return
        start = self._offset()
        self.body_count += 1
        self.body_starts.append((start, start + len(raw)))

    def _inspect(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        element_id = None
        for name, value in attrs:
            key = name.lower()
            if key == "data-editable-html-root":
                self.root_count += 1
            elif key == "id" and value:
                self.ids[value] = self.ids.get(value, 0) + 1
                element_id = value
        if tag.lower() in {"script", "style"} and element_id in {
            "eh-editor-page-style",
            "eh-editor-script",
        }:
            self._capture = (tag.lower(), element_id, [])


def parse_structure(html: str) -> StructureParser:
    parser = StructureParser(html)
    parser.feed(html)
    parser.close()
    return parser


def asset_text(name: str) -> str:
    path = Path(__file__).resolve().parent.parent / "assets" / name
    return path.read_text(encoding="utf-8").strip()


def build_bundle() -> str:
    css = asset_text("editor-page.css")
    ui = asset_text("editor-ui.html")
    runtime = asset_text("editor-runtime.js")
    return (
        f"{BUNDLE_START}\n"
        f'<style id="eh-editor-page-style" data-version="{BUNDLE_VERSION}">\n{css}\n</style>\n'
        f'<template id="eh-editor-template">\n{ui}\n</template>\n'
        '<div id="eh-editor-host" contenteditable="false" '
        f'data-version="{BUNDLE_VERSION}" aria-label="可编辑 HTML 控件"></div>\n'
        f'<script id="eh-editor-script" data-version="{BUNDLE_VERSION}">\n{runtime}\n</script>\n'
        f"{BUNDLE_END}"
    )


def add_body_root(html: str) -> tuple[str, bool]:
    structure = parse_structure(html)
    if structure.root_count:
        return html, False
    if len(structure.body_starts) != 1:
        raise ValueError(
            f"Expected exactly one <body> element, found {len(structure.body_starts)}."
        )
    start, end = structure.body_starts[0]
    raw = html[start:end]
    closing = raw.rfind(">")
    if closing < 0 or raw[:closing].rstrip().endswith("/"):
        raise ValueError("The <body> start tag is malformed or self-closing.")
    replacement = raw[:closing] + " data-editable-html-root" + raw[closing:]
    return html[:start] + replacement + html[end:], True


def inject(html: str) -> tuple[str, bool]:
    if BUNDLE_START in html or any(f'id="{item}"' in html for item in REQUIRED_IDS):
        raise ValueError("The editable HTML bundle already exists; refusing to inject a duplicate.")

    html, used_body_fallback = add_body_root(html)
    structure = parse_structure(html)
    if structure.root_count != 1:
        raise ValueError(
            f"Expected exactly one data-editable-html-root, found {structure.root_count}."
        )

    structure = parse_structure(html)
    if len(structure.body_ends) != 1:
        raise ValueError(f"Expected exactly one </body>, found {len(structure.body_ends)}.")
    insertion_point = structure.body_ends[0][0]
    bundle = "\n\n" + build_bundle() + "\n"
    result = html[:insertion_point] + bundle + html[insertion_point:]
    validate(result)
    return result, used_body_fallback


def validate(html: str) -> None:
    errors: list[str] = []
    structure = parse_structure(html)
    if structure.body_count != 1:
        errors.append(f"expected one body element, found {structure.body_count}")
    if len(structure.body_ends) != 1:
        errors.append(f"expected one body end tag, found {len(structure.body_ends)}")
    if structure.root_count != 1:
        errors.append(
            f"expected one data-editable-html-root, found {structure.root_count}"
        )
    if html.count(BUNDLE_START) != 1 or html.count(BUNDLE_END) != 1:
        errors.append("editable HTML bundle boundary markers are missing or duplicated")
    for item in REQUIRED_IDS:
        count = structure.ids.get(item, 0)
        if count != 1:
            errors.append(f"expected one #{item}, found {count}")
    for item in REQUIRED_CONTROL_IDS:
        count = structure.ids.get(item, 0)
        if count != 1:
            errors.append(f"expected one editor control #{item}, found {count}")
    if f'data-version="{BUNDLE_VERSION}"' not in html:
        errors.append(f"bundle version {BUNDLE_VERSION} is missing")
    expected_assets = {
        "eh-editor-page-style": asset_text("editor-page.css"),
        "eh-editor-script": asset_text("editor-runtime.js"),
    }
    for element_id, expected in expected_assets.items():
        actual = structure.text_by_id.get(element_id, "").strip()
        if actual != expected:
            expected_hash = hashlib.sha256(expected.encode("utf-8")).hexdigest()[:12]
            actual_hash = hashlib.sha256(actual.encode("utf-8")).hexdigest()[:12]
            errors.append(
                f"#{element_id} content differs from bundled asset "
                f"(expected {expected_hash}, found {actual_hash})"
            )
    if errors:
        raise ValueError("Invalid editable HTML:\n- " + "\n- ".join(errors))


def read_html(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError(f"{path} is not UTF-8 HTML: {exc}") from exc


def write_atomic(path: Path, text: str, file_mode: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
            handle.write(text)
        os.chmod(temp_name, file_mode)
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass
        raise


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inject or validate the self-contained editable HTML bundle."
    )
    parser.add_argument("input", type=Path, help="UTF-8 HTML input file")
    parser.add_argument("--output", type=Path, help="write to a new HTML file")
    parser.add_argument(
        "--in-place", action="store_true", help="replace the input file atomically"
    )
    parser.add_argument(
        "--check", action="store_true", help="validate an already-injected file"
    )
    args = parser.parse_args()
    if args.check and (args.output or args.in_place):
        parser.error("--check cannot be combined with --output or --in-place")
    if not args.check and bool(args.output) == bool(args.in_place):
        parser.error("choose exactly one of --output or --in-place")
    return args


def main() -> int:
    args = arguments()
    try:
        html = read_html(args.input)
        if args.check:
            validate(html)
            print(f"OK: {args.input} is a valid editable HTML bundle v{BUNDLE_VERSION}")
            return 0

        result, body_fallback = inject(html)
        destination = args.input if args.in_place else args.output
        assert destination is not None
        if destination.resolve() == args.input.resolve() and not args.in_place:
            raise ValueError("Use --in-place to replace the input file.")
        input_mode = stat.S_IMODE(args.input.stat().st_mode)
        write_atomic(destination, result, input_mode)
        root_note = "body fallback" if body_fallback else "marked content root"
        print(
            f"OK: wrote editable HTML bundle v{BUNDLE_VERSION} to {destination} "
            f"({root_note})"
        )
        return 0
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
