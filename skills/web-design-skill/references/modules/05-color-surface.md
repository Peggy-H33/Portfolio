# 05 — Color and surface lab

## Goal

Build a semantic color hierarchy that supports content and video instead of adding a fashionable gradient.

## Derive palette inputs

Use subject materials, imagery, environment, and emotional stakes. Extract colors from references only as evidence, then adapt them for contrast and originality.

## Define roles

Each candidate supplies:

- `canvas`: dominant page field;
- `surface-1`, `surface-2`: structural depth, not decorative card spam;
- `text-strong`, `text-body`, `text-muted`;
- `line`;
- `accent`, `accent-contrast`;
- `success`, `warning`, `danger` when product UI needs them;
- `media-scrim-start`, `media-scrim-end` scoped per video.

Use one dominant field, a restrained support range, and one primary accent by default. Distribute color by function rather than evenly.

Declare an approximate full-page area budget before implementation. For a cinematic dark page, neutrals and media-derived materials normally occupy 65–85%, while high-chroma flat accent fields occupy 5–20%. A saturated accent may dominate one deliberate section but not several consecutive screens unless the brief explicitly requests flat graphic art.

Prefer colored light, reflection, haze, grain, paper, metal, fabric, or photographic material over a featureless CSS rectangle. A pure electric-blue field is not automatically cinematic merely because nearby video uses blue light.

## Make 3 applied previews

Do not show swatches alone. Render each palette on:

- headline + body;
- primary and secondary actions;
- a media frame with overlay;
- a data/caption state;
- focus and hover state.

## Video overlays

Prefer one directional gradient or localized solid backing aligned to the copy safe zone. Avoid stacks of radial masks that create black ellipses or hide defects. Test the lightest and darkest frames, not just the poster.

## Contrast

- Test normal text, large text, UI controls, focus rings, disabled state, and text over motion.
- Do not use muted text so faint that it disappears on mobile OLED or compressed video.
- Declare `color-scheme` and matching `theme-color` for dark themes.

## Gate

Pass when the chosen palette works on static surfaces and moving media, every semantic role has an explicit token, and the desktop/phone full-page captures remain inside the declared chroma budget with visible recovery beats.
