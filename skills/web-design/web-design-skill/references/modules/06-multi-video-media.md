# 06 — Multi-video media system

## Goal

Treat video as narrative material distributed across the page. A rich page must not be a single background video plus static filler.

## Choose a media density

- Compact: 1 hero video only; allowed only for an explicit one-screen/short brief.
- Standard: 3 distinct videos—hero + 2 chapter/detail roles.
- Cinematic: 4–6 distinct videos with deliberate pacing; use only when content and performance budget support it.

## Assign roles before generation

Each video needs a unique job:

- hero-atmosphere: establish world and thesis;
- process-macro: show material, mechanism, or transformation;
- artifact-detail: reveal a product/detail close-up;
- context-environment: show use or surrounding world;
- transition-bridge: connect two chapters without carrying copy;
- outcome: conclude with consequence or emotional resolution.

Never reuse one output for different roles. Similar art direction is good; duplicate footage is not.

For each asset write one sentence explaining why it belongs specifically to the subject. Reject generic glowing rings, isolated product pedestals, neon tunnels, particles, empty sci-fi rooms, and anonymous brutalist corridors when they provide only fashionable atmosphere. Hero media must carry at least two subject-specific signals through material, setting, gesture, or camera behavior and must fail an unrelated-brand substitution test.

## Prompt contract

For each role record independently:

- subject and action;
- camera/framing/lens behavior;
- motion intensity and loop strategy;
- palette/lighting/material;
- target ratio, duration, resolution;
- focal subject coordinates at first, middle, and last frames;
- reserved copy-safe zone;
- prohibited text, logos, watermarks, UI, abrupt cuts;
- continuity notes with adjacent sections.

The agent chooses the available video model and execution order. This skill does not require SenseAudio or embed provider-specific API code.

## Asset contract

Use local relative files:

```text
media/hero-background.mp4
media/hero-background-poster.webp
media/chapter-01.mp4
media/chapter-01-poster.webp
media/chapter-02.mp4
media/chapter-02-poster.webp
```

Keep an adjacent JSON sidecar per video with prompt, provider/model when known, generation date, dimensions, duration, focal coordinates, safe zone, and processing history.

## Integration variants

### Full-bleed background

Use as the required Hero mode when `hero_contract.mode` is `cinematic-full-bleed`. The media field normally fills the Hero, while copy, UI, and subject occupy separately measured zones. Layer order: poster/video → one scoped directional scrim → content → navigation. The video may sit behind interactive UI, but UI must remain readable and outside the focal subject.

### Contained editorial film

Use for chapters or when the brief explicitly prioritizes intact documentary viewing. Do not substitute it for a locked full-bleed Hero because generation, copy, or mobile integration became difficult.

### Sticky chapter film

Use when one media frame changes with narrative chapters. Still use distinct video files; do not show all simultaneously. Provide non-sticky mobile fallback.

### Inline detail loop

Use for short muted close-ups inside a module. Include visible pause control if motion is not purely decorative or persists beyond 5 seconds.

## Playback contract

- Background: `autoplay muted loop playsinline`, decorative semantics, poster.
- Content video: controls or an accessible play/pause control, captions when speech matters.
- Do not depend solely on `canplay` to reveal video; use poster as the stable base and a timeout/error-safe enhancement.
- Respect reduced motion: keep poster, hide or pause autoplay motion, preserve information.
- Do not force remote generation URLs into final HTML.

## Crop and subject protection

- Generate near the delivery ratio whenever possible.
- Avoid crop → scale → CSS `cover` double processing.
- For `cover`, verify crop at 16:9, 4:3, 3:4, and 9:16 or switch to contained media.
- Map focal coordinates to CSS `object-position` tokens per breakpoint.
- Run an obstruction test: overlay component rectangles on sample frames; no critical subject intersection.

## Hero recovery order

If the generated Hero misses the requested focal box:

1. regenerate with numeric subject coordinates, explicit negative space, and stable camera language;
2. inspect alternative successful generations;
3. tune per-breakpoint `object-position` within a validated crop;
4. shorten or reposition copy inside the already declared copy-safe zone;
5. ask before changing a locked full-bleed Hero to a contained layout.

Do not shorten the desktop video window or invent a cutaway merely because the subject landed near center. The accidental frame does not own the page composition.

## Gate

Pass when each video exists, decodes, differs from the others, has a poster and sidecar, is assigned to a section with a validated safe zone, and has a credible subject-specific justification. For `cinematic-full-bleed`, also pass first/middle/last-frame obstruction checks, the unrelated-brand substitution test, and the declared Hero coverage target.
