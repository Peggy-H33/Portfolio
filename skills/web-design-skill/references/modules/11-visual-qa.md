# 11 — Visual QA

## Required captures

Capture at minimum:

- 1440×1000: top, middle, bottom;
- 768×1024: top and media-heavy section;
- 390×844: top, menu/open state if present, every video section;
- reduced motion at one desktop and one phone viewport;
- hero poster state, first playing frame, and representative bright/dark frame.
- baseline/reference Hero beside the new Hero when preserving an approved visual direction.
- one full-page desktop capture and one full-page phone capture for silhouette and color-budget review.

## Review passes

### Type

- family loaded, fallback acceptable, no faux weight;
- headline wrap intentional; no widows/collisions;
- body measure/leading readable; mixed script tested;
- buttons/captions not too small or overtracked.
- intended Chinese signature is visibly expressive and not reduced to a small `<em>` or secondary caption;
- distributed pages retain at least two expressive non-Hero surfaces and one is not a large title;
- expressive CTA/nav/caption/label/number roles pass final-size phone, 200% zoom, bright/dark, and fallback checks;
- no display block contains an unintended one-character or punctuation-only line; semantic phrase grouping survives desktop and phone;
- final-font metric preflight records a widest-line/container ratio at or below 1 for every signature/support-display module at desktop and phone;
- Latin brand type does not unintentionally overwhelm the declared Chinese first visual layer.

### Layout

- focal hierarchy clear in 3 seconds;
- section alignment does not collapse into all-centered text;
- no unintended horizontal scroll;
- absolute layers have explicit order and containing blocks;
- no proof/card/aside blocks video subject.
- locked `cinematic-full-bleed` Hero still covers at least the declared target area at desktop;
- no typography/copy merge converted the Hero into a contained window, top-right cutaway, or mobile lower strip.

### Color

- text/control contrast on lightest and darkest video frames;
- scrim is directional and restrained;
- focus and interactive states visible;
- palette does not become an undifferentiated accent wash.
- the measured high-chroma area stays inside `visual_quality_contract`; no several-screen run of featureless electric color survives.

### Media

- minimum expected distinct files exist;
- videos are visually distinct and assigned to distinct roles;
- poster, failure, reduced motion, and slow network states work;
- `object-position` preserves the subject at each breakpoint;
- no crop-scale-cover chain causing blur or compositional drift;
- below-fold media loading does not overwhelm first load.
- an off-target generated Hero was regenerated or explicitly approved, not allowed to redefine the layout.
- Hero has at least two subject-specific signals and fails the unrelated-brand substitution test.

### Regression

- compare baseline and final top screenshots at the same viewport;
- verify dominant media mode, subject scale, negative space, copy anchor, palette, and chrome density;
- record every intentional change; any unapproved loss of full-bleed coverage or cinematic hierarchy is a Major.

### Interaction/accessibility

- keyboard order and focus visible;
- semantic controls and labels;
- motion can be reduced/paused as appropriate;
- long text, empty state, and 200% zoom remain usable.

## Severity

- Blocker: missing/broken media, inaccessible primary action, obscured subject/copy, unreadable contrast, overflow preventing use.
- Major: weak type loading/fitting, repeated generic modules, inconsistent composition, incorrect responsive crop.
- Major: locked full-bleed Hero reduced to contained media; approved visual baseline lost; expressive Chinese request satisfied only by neutral large type.
- Major: generic Hero, accidental Chinese stair-step wrapping, several consecutive pure-accent screens, or missing full-page silhouette captures.
- Minor: small rhythm, transition, or copy-polish defect.

Do not report completion while blockers or majors remain. Apply `references/visual-finish-gate.md`; record screenshot path, finding, fix, and recheck result in `study/qa-report.md`.
