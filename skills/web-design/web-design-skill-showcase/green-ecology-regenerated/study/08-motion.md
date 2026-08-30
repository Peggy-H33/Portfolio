# 08 Motion and interaction

## Signature system

`waterline reveal`: section copy enters as if a horizontal waterline uncovers it—opacity 0→1 and translateY(24px)→0 while a thin rule grows left→right. It encodes reading order and echoes water flow without distorting glyphs.

## Tokens

- `--duration-fast: 160ms`
- `--duration-base: 360ms`
- `--duration-scene: 920ms`
- `--ease-standard: cubic-bezier(.22,.65,.28,1)`
- `--ease-emphasis: cubic-bezier(.16,1,.3,1)`

## Motion map

- Hero load: media poster is immediately visible; title lines reveal in reading order after `document.fonts.ready`, 160ms stagger. Purpose: establish signature hierarchy. End state is fully visible.
- Scroll reveals: `.reveal` modules trigger once at 18% intersection, using scene duration. Purpose: mark chapter boundaries.
- Waterline: width 0→100% over 920ms after its associated heading. Purpose: connect label to text field.
- Navigation state: active underline translates/scales in 160ms. Purpose: location feedback.
- Action rows: hover/focus shifts the action verb 10px and draws the line in 360ms; essential copy is always visible.
- Video itself: authentic model-generated environmental motion; no CSS scale/parallax applied.

## Media control state machine

- `auto-playing`: default when no reduced-motion preference; only the in-view video is muted, looped and playing while offscreen videos remain paused.
- `paused-poster`: default when reduced motion is requested or user pauses; videos are paused and opacity 0, posters remain.
- `explicit-playing`: user presses play, overriding the initial system default; videos become visible and call `play()`.
- `error`: video remains hidden, poster visible, button label becomes “部分影像不可用”.

Rapid presses cancel stale promise handling by incrementing a local playback request id.

## Reduced motion

- All reveal content starts fully visible; transforms and transitions are disabled.
- Videos initialize in `paused-poster`, never CSS-hidden permanently by the media query.
- The visible play button can enter `explicit-playing`; another press pauses and returns to poster.
- Sticky behavior becomes normal flow to reduce scroll-linked movement.

## Gate result

PASS. One signature reveal system, quiet state transitions and a complete reduced-motion/explicit-play behavior are specified; no animation carries inaccessible information.
