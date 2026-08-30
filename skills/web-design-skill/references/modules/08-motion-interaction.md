# 08 — Motion and interaction

## Goal

Use motion to reveal hierarchy, explain state, or sustain atmosphere. Avoid scattered animation for its own sake.

## Define hierarchy

Choose at most one signature motion system plus quiet supporting transitions:

- cinematic reveal tied to the hero thesis;
- chapter transition tied to scroll position;
- typographic mask/reveal tied to reading order;
- object/material transformation tied to product explanation;
- restrained editorial fade/slide.

## Tokens

Record durations and easing as tokens:

```css
--duration-fast: 140ms;
--duration-base: 260ms;
--duration-scene: 720ms;
--ease-standard: cubic-bezier(.2,.7,.2,1);
--ease-emphasis: cubic-bezier(.16,1,.3,1);
```

Match values to the chosen direction; do not copy these blindly.

## Rules

- Animate `transform` and `opacity` when possible.
- Never use `transition: all`.
- Keep animation interruptible and state-correct after rapid input.
- Use reveal delays to encode reading order, not arbitrary decoration.
- Hover effects cannot contain essential information unavailable on touch.
- Do not parallax copy and video so aggressively that their alignment breaks.
- For autoplay media, provide pause where required and preserve poster under reduced motion.

## Reduced motion

Define the alternative at planning time: remove transforms, stop auto-advancing scenes, display posters, preserve opacity/content, and maintain all interactions.

## Gate

Pass when every animation has a purpose, timing token, trigger, end state, and reduced-motion behavior.
