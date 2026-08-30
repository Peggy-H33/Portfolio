---
name: editable-html
description: Create or modify standalone HTML pages that users can edit directly in the browser and switch between 阅读模式 and 编辑模式. Use when the request says “可编辑 HTML/网页”, asks to edit page text or images in place, or wants a browser-editable HTML that can save its changes. Do not use for ordinary forms, CMS admin screens, or source-code editors.
---

# Editable HTML

Build the requested page normally, then add this skill's self-contained editor bundle. The page's visual design and subject matter remain primary; the editor is a reusable shell around it.

## Required outcome

- Deliver one standalone `.html` file unless the user asks for a multi-file project.
- Provide two modes. 阅读模式 is the default and the page content is not `contenteditable`; 编辑模式 reveals the full editor and makes the chosen content root editable.
- Preserve the reference feature set: undo/redo, block style, font size, bold/italic/underline/strike, text and highlight colors, format painter, clear formatting, image insertion, image selection/resizing/deletion, HTML download, and print.
- Keep the mode switch available in both modes. Hide all editor UI when printing.
- Embed inserted images as data URLs and keep the editor in any HTML downloaded from “保存 HTML”. A downloaded file must reopen in 阅读模式 with the edits preserved.
- Do not alter the original/source file unless the user explicitly asks for an in-place change.

## Build and inject

1. Create or finish the page HTML first. Put `data-editable-html-root` on exactly one element containing the visible document content. Prefer the page's existing main wrapper; using `<body>` is acceptable when wrapping would disturb its layout. Keep scripts and editor controls outside a nested root when practical.
2. Do not add another rich-text library or hand-copy a second toolbar. Run the bundled injector, which embeds the versioned CSS, UI template, and JavaScript into the output:

   ```bash
   python3 <skill-dir>/scripts/inject_editor.py input.html --output output.html
   ```

   Use `--in-place` only when in-place modification is explicitly intended. If no root marker exists, the injector marks `<body>` and reports that fallback.
3. Validate the final artifact:

   ```bash
   python3 <skill-dir>/scripts/inject_editor.py output.html --check
   ```

4. When browser control is available, open the final local file and verify: it starts in 阅读模式; 编辑模式 exposes the toolbar; text can be changed; switching back prevents content editing; image controls work; print preview omits editor UI; and 保存 HTML downloads a reopenable editable copy.

## Integration constraints

- Treat the editor namespace (`eh-` IDs/classes and `data-editable-html-*` attributes) as reserved. Do not rename or style it from page CSS.
- Do not place `data-editable-html-root` on more than one element.
- Avoid explicit descendant `contenteditable="true"` unless the page genuinely needs nested editing hosts. The runtime locks and restores them across modes, but fewer nested hosts make selection behavior more predictable.
- Preserve the user's page scripts and styling. If the page already contains this bundle, validate it instead of injecting a duplicate.
- `document.execCommand` is intentionally used for a dependency-free, single-file editor with native undo behavior. Do not replace it merely because it is deprecated; replace it only when the target browser demonstrably requires another implementation.
- If a strict Content Security Policy blocks inline script/style, report the conflict and produce a multi-file or nonce/hash-based variant only with the user's approval.

## Files

- `scripts/inject_editor.py`: deterministic injector and structural validator.
- `assets/editor-page.css`: page-level edit/print states.
- `assets/editor-ui.html`: isolated Shadow DOM toolbar and mode controls.
- `assets/editor-runtime.js`: editing, image, mode, save, and print behavior.
