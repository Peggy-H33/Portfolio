---
name: motion-site-art-directed-v9
description: Design and implement cinematic, responsive, video-led websites with full-bleed moving media, subject-specific art direction, expressive typography across the full page, controlled color/material budgets, typography-aware local geometry, and full-page screenshot critique. Use for landing pages, product launches, portfolios, music/culture sites, editorial campaigns, technology stories, or redesigns that need premium visual impact rather than merely valid sections. Also use with motion-site-chinese-web-design-v6; this skill owns macro structure and media while allowing evidence-backed local copy-grid adjustments so expressive Chinese never gets trapped in ugly narrow columns.
---

# Motion Site Art Directed V9

Build the page around one dominant visual field. Treat full-bleed video, expressive type, negative space, and section rhythm as one composition. Persist decisions before implementation so later typography or copy work cannot silently replace the selected art direction.

## Ownership

Own the brief, art-direction thesis, section order, macro grid, Hero geometry, media generation and placement, safe zones, color, surfaces, components, motion, responsive transformations, and final visual QA.

When another skill handles Chinese typography, follow [skill-integration-contract.md](references/skill-integration-contract.md). Keep macro structure and media ownership here, but treat local copy geometry as provisional until real glyphs are rendered. Accept evidence-backed changes to copy width, local grid span, alignment, section padding/min-height, metrics, color-within-copy-zone, and line breaks. Do not allow typography to change Hero media mode, media box, focal position, section order, video crop, global palette, or motion.

## Non-negotiable outcome

- Honor explicit visual priorities. If the user asks for “大视频背景”, “视觉冲击”, “沉浸式”, “电影感”, or approves a full-bleed reference, set `hero_contract.mode` to `cinematic-full-bleed` and lock it before the labs.
- In `cinematic-full-bleed`, the desktop Hero media field covers at least 90% of the Hero area and normally uses `position: absolute; inset: 0`. A small top/right video window, card, cutaway, or lower-half strip is not an equivalent fallback.
- Generate at least 3 distinct local videos for a rich long page: Hero atmosphere plus at least 2 section roles. Do not duplicate footage under different filenames.
- Regenerate or replace a Hero asset that misses its declared focal zone. Do not shrink an immersive Hero into contained media merely to accommodate a bad generation.
- Protect the subject with measured copy, interaction, and focal safe zones. Do not place proof cards, feature panels, asides, centered titles, or heavy masks over the focal subject.
- Treat typography as a full-page rhythm, not a Hero-only decoration. For expressive Chinese pages invoke `motion-site-chinese-web-design-v6` in `distributed` mode; for requests such as “丰富使用花体、多种花体、全页花体节奏” require `rich-script`. Preserve one strongest peak, use at least two distinct calligraphic/handwritten families, and distribute them across at least three non-Hero page regions and three semantic roles without turning long reading into a font collage.
- Reject accidental Chinese stair-step wrapping. Real display blocks must keep semantic phrases together and may trigger local copy-grid changes before the plan is re-locked.
- Before browser screenshots, measure every signature/support-display block with the final committed font bytes, final CSS size, and final copy-zone width. A widest-line/container ratio above 1 is an immediate geometry failure; a passing metric is only a preflight and never replaces final-layout screenshots.
- Declare a color/material budget from the full-page silhouette. High-chroma flat fields normally occupy 5–20% of a cinematic long page and may dominate at most one deliberate beat; neutrals and media-derived materials provide recovery.
- Reject a Hero that passes only geometry. It must carry at least two subject-specific visual signals and fail the unrelated-brand substitution test before it can become the dominant field.
- Preserve a user-approved visual baseline. Typography, copy, or responsive work may refine it but may not change its dominant media mode without explicit user approval.
- Deliver responsive code, posters and failure fallbacks, reduced-motion behavior, accessible controls, and screenshot-based QA.

## Progressive workflow

Start with [workflow-index.md](references/workflow-index.md). Read only the current discipline.

| Stage | Read | Persist |
|---|---|---|
| 0. Brief | `modules/01-brief-content.md` | `study/01-brief-content.md` |
| 1. Evidence | `modules/02-reference-evidence.md` | `study/02-reference-evidence.md` |
| 2. Typography | `modules/03-typography.md`; optional V6 handoff | `study/03-typography.md` |
| 3. Layout | `modules/04-layout-composition.md` | `study/04-layout.md` |
| 4. Color | `modules/05-color-surface.md` | `study/05-color.md` |
| 5. Media | `modules/06-multi-video-media.md` | `study/06-media.md` + `media-plan.json` |
| 6. Components | `modules/07-components-copy.md` | `study/07-components.md` |
| 7. Motion | `modules/08-motion-interaction.md` | `study/08-motion.md` |
| 8. Responsive | `modules/09-responsive-quality.md` | `study/09-responsive-quality.md` |
| 9. Synthesis | `modules/10-synthesis-build.md` | `study/page-plan.json` |
| 10. QA | `modules/11-visual-qa.md` | `study/qa-report.md` + screenshots |

## Procedure

### 1. Lock the visual priority

Record the subject, audience, page job, reference preference, and one dominant visual priority. If the user prefers an existing page, record its screenshot or source path as `regression_baseline` and describe the protected qualities—such as full-screen video, left copy/right subject, sparse chrome, or amber-on-black palette.

Do not translate “premium” into generic cards. Derive materials, instruments, environments, camera behavior, and typographic energy from the subject.

### 2. Extract evidence

Use browser/VLM/image inspection for supplied pages and media. Separate observation, inference, and decision. Record typography, hierarchy, media coverage, focal coordinates, negative space, surface, motion, and breakpoint behavior. Convert references into rules rather than copies.

### 3. Run four labs without reopening the brief

Create three real candidates for type, layout, color, and media.

- If `cinematic-full-bleed` is locked, at least two layout candidates must preserve a full-bleed Hero and the selected candidate must preserve it. A contained candidate may be shown only as an explicit contrast, not as an automatic safe choice.
- Test type with real Hero, section heading, quote, brand, CTA, navigation, label/caption/number, long body, and any other planned visible surface on representative backgrounds. Do not preload a preferred family into the lab. Small expressive type must be checked at its final CSS size, on phone, at 200% zoom, on bright/dark states, and under fallback.
- Record the worst desktop and phone line-fit sample for every signature/support-display module after final font selection. Use the actual final copy container, not the specimen canvas; reject or locally reflow any sample whose measured line is wider than the container.
- Generate media prompts from declared focal and copy zones. Review first, middle, and last frames before integration.
- Reject a candidate with rendered evidence. “Safer”, “cleaner”, “too Chinese”, or “too playful” is not enough when it contradicts an explicit user preference.

### 4. Produce a closed page plan

Write `study/page-plan.json` against `references/page-plan.schema.json`. Include `hero_contract` with mode, coverage target, safe zones, regeneration policy, mobile transformation, and locked fields. Every section declares its purpose, media role, layout, type roles, layers, responsive behavior, reduced-motion state, and source status.

When using Chinese V6, provide the typography skill with the page plan, every section's unique surface IDs, expressive opportunities, reading-protected surfaces, and representative frame screenshots. Leave font families and local copy geometry unlocked until V6 returns rendered evidence. Apply approved local geometry adjustments, capture the real page again, then lock them. Merge only after confirming that macro layout, media, section order, global color, and motion remain owned here.

### 5. Generate media as a system

The agent may use any available video-generation capability. This skill defines the asset contract, not a provider API. Generate separate outputs for separate narrative roles. Save a local poster and JSON sidecar for every video.

For a failed Hero composition, try in this order:

1. regenerate with stronger focal coordinates and negative-space language;
2. choose another successful generation;
3. adjust `object-position` within the validated crop range;
4. revise copy length or position inside its safe zone;
5. request approval before abandoning the locked full-bleed mode.

Never jump directly from a focal miss to a small contained window.

### 6. Build in ownership order

Implement semantic HTML and real copy, then tokens, macro grid, full-bleed media, safe-zone copy, components, motion, responsive transformations, and accessibility. Start from `assets/starter/` only as a media/fallback contract; it is not a visual template.

Keep Hero media stable while typography is applied. A line break may change within the copy zone; the media box, subject position, and section geometry may not.

### 7. Verify visual impact and regressions

Run:

```bash
python scripts/validate_output.py <output-project>
python scripts/validate_skill_package.py .
```

Capture desktop, tablet, phone, poster, playing, bright-frame, dark-frame, reduced-motion, 200%-zoom, and full-page desktop/phone states. Read [visual-finish-gate.md](references/visual-finish-gate.md) and critique the full-page silhouette. Fail when a locked full-bleed field becomes a card/window, when the Hero is generic, when accent color blankets the long page, when Chinese display text forms unintended single-character lines, when expressive Chinese disappears below Hero, when the subject is obstructed, or when the page becomes uniformly centered or component-heavy.

## Anti-patterns

- Replacing a requested full-bleed Hero with a cropped upper-right video panel.
- Letting a badly positioned generated subject redefine the entire layout instead of regenerating it.
- Treating the biggest Latin brand word as the only expressive type while Chinese becomes secondary utility copy.
- Treating calligraphic, handwritten, playful, or experimental Chinese as “headline only” and automatically neutralizing every CTA, quote, caption, label, navigation accent, or number.
- Freezing a narrow title column before real Chinese glyphs are tested, then calling broken wraps a typography problem.
- Filling several consecutive screens with one pure electric accent instead of using colored light, material, texture, and recovery fields.
- Selecting a generic glowing object or neon corridor as Hero merely because it has a convenient copy-safe zone.
- Allowing typography or copy optimization to alter the media frame, page structure, or art direction.
- Shrinking desktop media to match a mobile limitation.
- Reusing one video, hiding video without fallback, crop-scale-cover chains, or heavy masks that conceal defects.
- Floating proof/capability cards over media, repeated equal cards, decorative numbering, and generic centered Hero stacks.
- Declaring completion from validators without inspecting real screenshots.

## Resources

- Workflow and ownership: `references/workflow-index.md`, `references/skill-integration-contract.md`
- Final aesthetic judgment: `references/visual-finish-gate.md`
- Discipline modules: `references/modules/`
- Candidate catalogs and schemas: `references/*.yaml`, `references/*.json`
- Reusable media contract: `assets/starter/`
- Study templates: `assets/study-packet/`
- Project and package checks: `scripts/create_study_packet.py`, `scripts/validate_output.py`, `scripts/validate_skill_package.py`
