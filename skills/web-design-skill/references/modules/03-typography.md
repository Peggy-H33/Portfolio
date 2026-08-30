# 03 — Typography lab

## Goal

Choose type from content, language, and subject character. The output is a visible specimen and a complete loading/fallback contract—not “use a nice font.”

## Step 1: classify the voice

Record 3–5 subject-derived traits, then map them to type attributes:

- precision → controlled apertures, stable widths, tabular numeric support;
- editorial authority → high-contrast or sturdy serif used with restraint;
- engineered energy → condensed display, sharp grotesk, or technical mono utility;
- craft/intimacy → humanist shapes, softer stress, generous body leading;
- cultural/historic context → appropriate script/language coverage and provenance.

## Step 2: define text surfaces, not a font pair

Declare separate tokens and specimen rows for the actual surfaces present:

- `hero`: highest-impact phrase;
- `section`: chapter transitions and repeated headings;
- `quote`: editorial or human voice;
- `accent`: brand mark, CTA phrase, nav accent, badge, caption lead-in, number or short label;
- `reading`: long paragraphs and dense explanation;
- `utility`: forms, code, data or critical status when present.

These are behavioral roles, not fixed font families. Use 2–4 active families when the rendered hierarchy needs them; a single family may serve several roles, and a different expressive family may distinguish a later chapter. Do not impose an occurrence count. Long paragraphs and critical transactional controls are reading-protected by default, but a short body line or functional label may use expressive type after final-size legibility checks.

For expressive Chinese pages delegate selection and loading to `motion-site-chinese-web-design-v6`. V9 owns the macro composition and supplies the page plan, unique IDs for every visible text element, representative frames, safe rectangles, expressive opportunities, and reading-protected surfaces. It must not preselect the Chinese family. Keep local copy width, grid span, alignment, section padding/min-height, and line breaks provisional until real glyphs are rendered; V6 may propose changes to those fields, which V9 approves against media safety before locking them.

The largest intended Chinese phrase must remain a first-class visual role. Do not satisfy an expressive-Chinese request by styling only a small `<em>` while the principal Chinese line remains a neutral UI face. Do not let a huge Latin brand mark demote the Chinese thesis unless the brief explicitly makes the Latin name the sole primary subject.

## Step 3: create 3 candidates

Use the page's real Hero, each distinct section-heading pattern, quote, 80–140 characters of body copy, CTA, nav, caption, labels, numerals, and any other planned text surface. Compare candidates in `assets/font-lab.html`. Candidates must differ in voice, not just weight, and no family may win merely because the lab shipped with it as a default.

For each record:

- exact family, source/license, files or provider URL;
- weights/styles actually loaded;
- fallback stack and script coverage;
- optical size/variable axes if used;
- display size, line-height, max width, tracking, wrap target;
- body size, line-height, paragraph measure;
- button/label treatment;
- reasons to choose and reject.

When expressive Chinese is required, compare at least two distinct expressive categories plus one restrained control for the signature and every planned non-Hero expressive module. For `rich-script`, render at least two different calligraphic/handwritten families in final page regions; do not simulate richness by repeating one font at different sizes. Reject from rendered evidence; “too Chinese,” “too playful,” or “safer” is not sufficient.

## Step 4: fitting rules

- Headline: `text-wrap: balance`; 2–4 lines by design, not accident.
- Body: `text-wrap: pretty`; generally 45–75 Latin characters per line; verify CJK by visual rhythm rather than Latin count alone.
- Use `clamp()` with a controlled minimum and maximum; never shrink below readable size to make copy fit.
- Use `font-variant-numeric: tabular-nums` for comparisons and data.
- Test 200%, long words/URLs, Chinese punctuation, mixed Latin/CJK, and missing web-font fallback.
- Preload only critical local WOFF2; use `font-display: swap`; avoid loading unused weights.
- For expressive reading/utility text, record the final CSS sizes and pass phone, 200% zoom, bright/dark background, and fallback checks.
- Record explicit desktop and phone line arrays for every display block. Reject unintended single-character lines, punctuation-only lines, or stair-step wrapping caused by a copy column that is too narrow.

## Anti-repetition

Maintain a project-level font ledger. Avoid the previously selected display pair in the next unrelated project unless it is clearly the best subject match. Inter, Roboto, Arial, system UI, and Space Grotesk are not automatic defaults.

## Gate

Pass only after specimens are inspected inside the final page at desktop and phone widths, one strongest type peak remains clear, and expressive rhythm is visible beyond Hero. In V6 `distributed` mode require its declared coverage; in `rich-script` require at least two real script families across multiple regions and roles. Re-run layout screenshots after every local geometry adjustment, then lock the accepted values without changing media coverage or focal safety.
