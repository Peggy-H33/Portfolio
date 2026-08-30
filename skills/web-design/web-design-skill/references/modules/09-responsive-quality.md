# 09 — Responsive, accessibility, and performance

## Responsive transformation

Design at 1440, 768, and 390 widths, plus one wide and one short viewport. Do not merely shrink desktop.

For each section declare whether it:

- reflows;
- reorders;
- changes alignment;
- changes media containment/crop;
- hides only decorative material;
- becomes scrollable;
- swaps to a poster or alternate asset.

Mobile video must not be arbitrarily moved to the lower 56% of the hero unless that is a deliberate composed module. If the focal subject cannot survive a narrow `cover` crop, use contained media, an alternate vertical render, or a poster.

## Accessibility baseline

- Semantic landmarks, heading order, skip link.
- Visible `:focus-visible` states.
- Labels/`aria-label` on controls; decorative media is hidden from assistive tech.
- Pause/controls/captions according to video content.
- No information solely by color or motion.
- Zoom remains enabled; content works at 200%.
- Target sizes and safe-area insets work on touch devices.

## Performance budget

Record budgets before implementation:

- first hero poster and critical font preload only;
- video poster visible before playback;
- below-fold video uses `preload="metadata"` or `none` and loads near viewport;
- do not autoplay several large below-fold videos simultaneously;
- width/height or aspect ratio prevents layout shift;
- local optimized formats and no unused font weights;
- pause offscreen looping videos when practical.

Multiple video files do not mean simultaneous downloads/playback. The agent decides loading strategy based on viewport and narrative.

## Gate

Pass when keyboard, reduced motion, 200% zoom, mobile crop, loading order, and no-JS/poster states remain usable.
