# 02 — Reference and VLM evidence

## Goal

Convert URLs, screenshots, and crawled prompts into structured visual evidence without copying a source page.

## Inspection sequence

For each reference capture desktop and narrow viewport states when possible. Inspect these independently:

1. Content hierarchy and reading path.
2. Typefaces, role contrast, scale, width, tracking, line-height, measure.
3. Grid, edges, negative space, alignment, overlap, section rhythm.
4. Color roles, dominance, contrast, saturation distribution, surface depth.
5. Image/video subject placement, crop, safe zones, overlays, poster state.
6. Navigation, buttons, cards, data, quotes, proof, gallery, footer.
7. Motion trigger, duration, easing, sequence, reduced-motion alternative.
8. Responsive transformation: reflow, hide, reorder, crop, containment.

## VLM prompt contract

Ask the vision model to return observations, not style labels alone:

```text
Describe only visible evidence. For each dimension list:
- observation;
- location and approximate proportion;
- confidence;
- likely implementation rule;
- uncertainty.
Pay special attention to type metrics, grid edges, media focal subject,
empty/safe zones, overlays, and responsive crop risk.
Do not identify or reproduce brand assets or copy.
```

## Evidence quality

- High confidence: directly visible or measurable.
- Medium: plausible implementation inferred from pixels.
- Low: aesthetic interpretation or hidden behavior.
- Never turn low-confidence inference into a mandatory rule.

## Conflicts

If two references solve a module differently, preserve both as named variants with selection conditions. Do not blend them until neither remains distinctive.
