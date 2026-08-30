# Skill integration contract

Use this contract when a specialist skill modifies one discipline after the art direction is locked.

## Ownership table

| Decision | Art-directed V9 | Chinese typography V6 |
|---|---|---|
| Page job, section order, DOM hierarchy | owns | reads only |
| Hero mode, media box, crop, focal point | owns and locks | reads only |
| Macro grid, media safe zones, breakpoints, z-index | owns and locks | reads only |
| Local copy width/span/alignment/padding/min-height | approves and re-locks | may propose from rendered glyph evidence |
| Color system, surfaces, motion | owns | may choose text color from approved tokens |
| Chinese font files and licenses | consumes | owns |
| Module font family, real weight, metrics | leaves unlocked, then approves merge | owns from rendered evidence |
| Expressive opportunities per section | identifies from composition | audits and selects |
| Expressive distribution and reading protection | supplies surface map | owns and validates |
| Short-title line breaks | approves against safe zone | proposes |
| Final screenshot and regression QA | owns | contributes type checks |

## Handoff from V9

Provide:

- `study/page-plan.json` with `hero_contract` and locked fields;
- real Chinese strings and semantic module IDs;
- every section's candidate `expressive_type_opportunities` and explicit reading-protected surface IDs;
- representative bright and dark video frames;
- copy-safe rectangles per breakpoint;
- approved color tokens and user preference words;
- a baseline screenshot when preserving an existing direction.
- `font_family_lock_state: unlocked-for-typography-lab`; V9 must not pass a predetermined Chinese family as the answer.
- `typography_geometry_state: provisional-for-real-glyph-test` plus allowed local adjustment bounds.

## Return from V6

Accept only:

- `study/typography-module-plan.json`;
- font files, licenses, and loading CSS;
- type tokens and selector mapping;
- proposed line breaks and text-color tokens;
- distribution mode, expressive/non-Hero/reading-protected surface IDs, and the final expressive font IDs;
- final-size legibility checks for every expressive reading or utility surface;
- explicit desktop/phone line arrays and any proposed local geometry adjustments;
- desktop/tablet/phone typography screenshots.

After accepting the return, render the actual page, approve/reject each local geometry proposal, then update the final page plan to `font_family_lock_state: selected-from-rendered-evidence` and `typography_geometry_state: locked-after-real-glyph-test`.

Reject the handoff when V6 changes media geometry, macro layout, section order, global color, or motion. Also reject a distributed handoff that places expression only in Hero or section titles. Local copy-grid changes are permitted only when declared, bounded, screenshot-tested, and approved by V9.

## Merge gate

Compare before/after Hero and full-page screenshots. Media coverage, focal-subject position, section rhythm, and dominant art-direction signature must remain materially unchanged. The intended Chinese signature must become more visible, and at least two non-Hero expressive surfaces must remain visible in the final page when `distributed` is selected.
