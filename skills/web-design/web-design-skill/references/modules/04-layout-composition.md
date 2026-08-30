# 04 — Layout and composition lab

## Goal

Create a page-specific spatial thesis, avoid automatic centered heroes and repeated card grids, and protect media subjects.

## Lock macro media, keep copy geometry provisional

Read `hero_contract` before drawing candidates. If the user asks for a large video background, immersive Hero, cinematic impact, or preservation of an approved full-screen reference, use `cinematic-full-bleed`:

- desktop media covers at least 90% of the Hero area and normally fills it edge to edge;
- the copy occupies measured negative space inside the field, not a separate card;
- at least two of the three layout candidates preserve full-bleed media;
- a contained/cutaway option may appear only as a rejected contrast;
- mobile may recompose copy, but must preserve a large intentional media field rather than defaulting to a lower-half strip.

Do not reopen the mode because a generated subject lands in the wrong place. Regenerate the asset or revise copy inside its safe zone first. However, do not freeze the exact copy-column width or local grid span before the actual Chinese candidates render. Typography may widen, narrow, offset, or re-align a copy zone inside the verified negative space.

## Establish geometry

Record:

- outer gutter at 360, 768, 1440, and wide desktop;
- max content width and full-bleed exceptions;
- column count, gaps, baseline rhythm;
- headline anchor, media focal coordinate, and action anchor;
- section density sequence: dense/quiet transitions;
- allowed overlaps and layer ownership.
- provisional copy widths and the maximum local adjustment that still clears the subject.

## Produce 3 wireframes

Each candidate must change the reading path and focal geometry:

1. Edge thesis: copy on one edge, focal media on the other, shared full-bleed field.
2. Bottom/offset thesis: large full-bleed media with copy anchored to a measured quiet corner or baseline.
3. Chaptered immersion: full-bleed Hero followed by alternating contained or sticky media chapters.

Use a contained editorial Hero only when the user or subject explicitly prioritizes intact documentary viewing over immersion. Do not let the catalog force one of every pattern when that contradicts the locked brief.

ASCII is sufficient before code. Annotate media safe zones and expected fold.

## Alignment decision

Centered text is allowed only when:

- the media is abstract or peripheral;
- the central region is measured as quiet;
- the text does not obscure the narrative subject;
- the rest of the page is not also uniformly centered.

Otherwise use edge-, baseline-, bottom-, or grid-aligned composition.

## Section rhythm

Vary scale and density intentionally. A strong default sequence is not a fixed module list but a rhythm:

- immersive beat;
- concise explanatory beat;
- tactile/detail beat;
- evidence or context beat;
- calm action beat.

Avoid stacking 3-card grids, rounded panels, and equal-height sections throughout.

## Typography feedback loop

After the first typography merge, render each display block inside the real page. Permit these local adjustments when evidence shows ugly wrapping or weak silhouette:

- copy-zone width and grid-column span;
- local alignment or anchor inside the same section;
- section padding and min-height;
- headline max-width, font size, leading, tracking, and explicit line breaks.

Do not permit section reordering, media-box changes, focal-point movement, or global palette replacement through this loop. Re-lock the accepted local geometry in `typography_geometry_state` only after desktop and phone screenshots pass.

## Layer contract

Use explicit named layers:

```css
--z-media: 0;
--z-overlay: 1;
--z-content: 2;
--z-nav: 10;
--z-modal: 100;
```

Every absolutely positioned child must declare its layer and containing block. `isolation: isolate` does not replace explicit z-index.

## Gate

Pass when the selected wireframe preserves `hero_contract.mode`, meets its coverage target, has clear mobile transformations, keeps copy outside the focal zone, and survives real-glyph desktop/phone rendering without accidental one-character display lines. Record rejected candidates and a before/after baseline thumbnail when preserving an existing page.
