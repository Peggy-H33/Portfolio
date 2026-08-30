# 05 Color and surface lab

## Material inputs

Wet peat, silt, moss, reed stem, fog, shallow water, oxidized concrete, chlorophyll seen through reflected light.

## Candidate A — Forest nocturne

- canvas `#081A13`; surface-1 `#11271C`; surface-2 `#1B3324`
- text-strong `#F0F2E7`; text-body `#D2DACB`; text-muted `#96A697`
- line `#D9E6D133`; accent `#B9EF70`; accent-contrast `#102012`
- Application result: excellent Hero contrast, but three dark video chapters make the full-page silhouette too uniformly nocturnal.

## Candidate B — Peat / fog / living signal — selected

- canvas `#0B1712`; surface-1 (peat) `#14251C`; surface-2 (fog bone) `#E8E6D8`
- text-strong-dark `#F2F0E5`; text-body-dark `#D3D8CB`; text-muted-dark `#99A89A`
- text-strong-light `#102018`; text-body-light `#34433A`; text-muted-light `#637067`
- line-dark `#E8E6D82E`; line-light `#1020182B`
- accent `#B8E36A`; accent-contrast `#102018`; focus `#D9FF91`
- media scrim: one linear field from `rgba(5,16,11,.76)` at left to transparent at 56%; no radial defect masks.
- Application result: dark immersive media has clear recovery beats on fog-bone sections. Acid green remains a thin living signal.

## Candidate C — Silt / water blue

- canvas `#18201D`; surface-1 `#2A3029`; surface-2 `#DDD5C1`
- text-strong `#F2EBDD`; text-body `#D3CCBE`; accent `#79C6B9`
- Application result: calm and documentary, but the cool aqua shifts the story toward marine conservation and weakens the vegetation/soil emphasis.

## Selected semantic tokens

Candidate B is locked. The only high-chroma flat token is `#B8E36A`, used for focus, tiny rules, nav state, one action hover and the circular progress trace.

## Full-page area budget

- Media-derived dark neutrals and peat: 56–64%.
- Fog-bone recovery fields: 26–34%.
- Silt/reed material colors inside videos: 8–16% (photographic, not flat CSS).
- Flat high-chroma accent: target 2–5%, hard ceiling 8%.

## Contrast intent

- Bone on peat and peat on bone are the default body relationships.
- Accent green is paired with peat for controls and focus; no muted green text is used for long reading.
- Over video, display and body text use bone plus a single directional scrim aligned to the copy zone.
- Disabled states are unnecessary; every interactive item has visible hover/focus treatment.

## Bright/dark frame behavior

- Bright fog: scrim reaches .78 on the copy edge, falls to zero before the subject zone.
- Dark reeds: scrim reaches .48 so black areas do not swallow hairline strokes.
- Poster fallback uses the same crop and tokenized scrim.

## Gate result

PASS. Candidate B supplies explicit roles for light/dark surfaces, focus, line and video scrims while preserving a restrained chroma budget and multiple recovery beats.
