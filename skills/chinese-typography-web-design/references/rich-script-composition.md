# Rich script composition

Use this route when the user asks for “丰富使用花体”, “多种花体”, “全页有花体节奏”, or otherwise expects more than one calligraphic moment.

## Required spread

Set `rich_script_required: true` and `mode: distributed`. The final page must contain:

- at least two distinct `calligraphic` or `handwritten` font families;
- at least four expressive non-Hero surface IDs;
- at least three semantic module types, such as section heading, editorial quote, CTA, brand mark, caption/badge, navigation accent, or number;
- expressive use in at least three non-Hero page regions;
- one strongest peak, so “rich” does not become an evenly loud font collage.

Count real DOM elements, not CSS selectors. Every visible text element must have a unique `data-type-surface` value; repeated values such as `section-heading` across four sections are invalid because they hide local decisions.

## Family choreography

Give each script family a different job:

- one family may carry the Hero and one short reprise;
- a second family may carry quotes, chapter transitions, handwritten annotations, or a final action;
- an experimental display family may support data, labels, or selected section titles;
- a reading family protects long paragraphs and critical controls.

Do not repeat one calligraphic family everywhere at different sizes and call that rich typography. Do not assign a different font to every element.

## Local geometry handshake

Real Chinese glyphs may expose a bad copy container. Propose bounded adjustments to:

- copy-zone width;
- local grid span;
- local alignment;
- section padding or minimum height;
- headline max-width and explicit line breaks.

Record each proposal in `geometry_adjustments`, render it inside the final page, and return screenshots. Never change media geometry, focal position, section order, or the global palette.

## Line-shape gate

For every signature or support-display module record exact desktop and phone lines.

- Reject accidental one-character or punctuation-only lines.
- Keep semantic phrases intact.
- Treat 4–8 Han characters per desktop display line and 3–6 per phone line as a starting range, not a forced formula.
- If a single-character line is an intentional poster device, set the approval flag and provide a concrete visual reason and screenshot.
- Do not use `text-wrap: balance` as a substitute for authored Chinese line breaks.
- Measure the widest authored line with the final committed font bytes at the final CSS size. Record the worst desktop and phone `longest_line_width_px / available_width_px`; the ratio must be at most 1 before screenshots, but numeric fit does not replace final-layout visual QA.
