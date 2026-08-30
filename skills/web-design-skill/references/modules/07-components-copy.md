# 07 — Components and copy

## Goal

Choose modules because they communicate or enable something, not because a template contains them.

## Component contract

For every module record:

- user question it answers;
- required content and source;
- semantic element and keyboard behavior;
- visual priority;
- default, hover, focus, active, loading, empty, error states as relevant;
- desktop and mobile geometry;
- relationship to nearby media safe zones;
- removal condition.

## Navigation

- Use real anchors for navigation and buttons for actions.
- Keep labels short and stable; expose current location where useful.
- Provide skip link and visible focus.
- Mobile navigation must not be a visually scaled desktop bar; define drawer/menu behavior and safe-area padding.

## CTA

Name the result: “Request a demo,” “View the architecture,” “Explore the collection.” Avoid “Learn more” when a more specific label exists. Primary and secondary actions must be distinguishable without relying only on color.

## Proof and capability modules

These are optional. Add them only when factual evidence exists and users need it at that point.

Do not create a floating aside by default. A proof module must satisfy all:

1. real source-backed evidence;
2. a declared layout cell or normal-flow region;
3. no intersection with video focal subject or core copy;
4. clear mobile relocation/removal behavior;
5. visual weight lower than the page thesis unless it is the thesis.

If any condition fails, move it below the hero, convert it to a slim rail, integrate it into the narrative, or remove it.

## Cards and lists

- A grid is for comparable items, not for unrelated content.
- Use numbering only when order matters.
- Prefer varied editorial modules over universal rounded cards.
- Handle long and empty content; set `min-width: 0` in flex/grid children.

## Gate

Pass when every visible component has content, interaction, and responsive justification.
