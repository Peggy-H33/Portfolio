# 10 — Synthesis and build

## Goal

Turn selected lab results into one closed implementation plan and then code without silent drift.

## Page plan

Validate `study/page-plan.json` against `references/page-plan.schema.json`. Include:

- chosen art-direction thesis and one signature element;
- complete tokens for type, color, spacing, layout, layer, and motion;
- exact section order and module contracts;
- exact media mapping from `media-plan.json`;
- breakpoint transformations;
- factual source state for visible claims;
- implementation stack and asset paths.

Also include:

- `hero_contract`: locked mode, media coverage target, subject/copy/interaction zones, regeneration policy, mobile transformation, and locked fields;
- `regression_baseline`: source/screenshot and protected visual qualities when an earlier page is preferred;
- `integration_contract`: ownership and allowed changes for typography or copy specialists.
- `visual_quality_contract`: subject-specific Hero evidence, color/material area budget, full-page captures, and forbidden silhouette failures.
- `typography_geometry_state`: provisional before real-glyph tests, then locked with approved local adjustments.

## Critique before code

Ask:

- Could this design fit an unrelated AI/startup/luxury brief unchanged?
- Is the hero alignment determined by media and content, or habit?
- Are the font candidates genuinely different, and does the chosen pair support the languages?
- Do the 3+ videos tell different beats?
- Is the strongest signature still clear while expressive type visibly continues beyond Hero?
- Does any Chinese title fall into an accidental staircase or one-character line because its column is too narrow?
- Does a high-chroma CSS field dominate several screens instead of appearing as a controlled accent or colored light?
- Could the Hero sell an unrelated product or brand unchanged?
- Does every decorative object support subject, hierarchy, or navigation?
- Does the Hero still occupy the intended visual field, or did an asset/copy problem shrink it into a window?
- Is the intended Chinese display phrase a primary visual event rather than a small decorative exception?
- For a distributed Chinese page, are at least two non-Hero surfaces expressive, with at least one quote, brand, CTA, nav accent, caption, badge, label, or number rather than another large title?
- Did any specialist skill modify a locked media, layout, section, color, or motion decision?

Revise the plan before writing code if an answer is weak.

## Implementation order

1. Semantic HTML and real copy.
2. Token layer and font loading.
3. Macro grid and section rhythm.
4. Media frames and safe zones.
5. Components/states.
6. Motion and progressive enhancement.
7. Responsive transformations.
8. Accessibility/performance polish.

When merging Chinese typography V6, apply its font faces and per-surface tokens after the macro grid and media contract are stable. Accept only its declared local geometry proposals, render them in the real page, approve or reject each against focal safety, then set `typography_geometry_state` to locked. Do not paste recommendations as replacement page CSS or reopen media geometry.

Do not let later component CSS silently override earlier layout. Keep specificity shallow and scope state classes deliberately.

## Starter use

`assets/starter/` demonstrates a semantic three-video and fallback contract. Copy its concepts, then replace its neutral styling, content, media, tokens, and composition with the chosen page plan. It is not a visual template. Read `references/visual-finish-gate.md` before the final build pass.
