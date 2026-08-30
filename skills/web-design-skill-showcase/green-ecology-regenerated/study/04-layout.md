# 04 Layout lab

## Hero contract input

- Mode: `cinematic-full-bleed` (locked).
- Desktop coverage: 100% of Hero, minimum 100svh.
- Focal zone: x 52–94%, y 22–88%; copy and controls must not enter it.
- Copy safe zone desktop: x 5–44%, y 25–82%; real-glyph adjustment stays inside x=50%.
- Copy safe zone phone: x 6–94%, y 12–38%; validated bird/reed motion remains at right and below the title.
- Media fit/position: cover; desktop center center; mobile 53% center after generated-frame review.

## Grid geometry

- 1440+: 12 columns, 24px gap, 5vw outer gutter, 1320px max reading grid; media remains full bleed.
- 768–1439: 8 columns, 20px gap, 32px gutter.
- 360–767: 4 columns, 14px gap, 20–22px gutter.
- Wide desktop: content max 1480px, outer field remains flexible.
- Baseline rhythm: 8px; large section spacing in 80/120/160px multiples.
- Named layers: media 0, overlay 1, content 2, nav 10, modal 100.

## Candidate A — Edge thesis / full-bleed

```text
┌──────────────────────────────────────────┐
│ nav                                      │
│                                          │
│ COPY 5 cols         QUIET      SUBJECT   │
│ 一滴雨                 water → reeds     │
│ 回家的路                      x 62–90%   │
│ CTA                                      │
│                                  01 / 05 │
└──────────────────────────────────────────┘
```

Reading path is direct and safe. Rejected as the whole-page system because repeating left-copy/right-subject would become uniform; retained for Hero only.

## Candidate B — Bottom offset / full-bleed

```text
┌──────────────────────────────────────────┐
│ fog / sky                                │
│                         SUBJECT          │
│                                          │
│                       title on baseline  │
│ field note ─────────────── CTA           │
└──────────────────────────────────────────┘
```

Strong cinematic frame, but the bottom title competes with water reflections and becomes fragile on phone. Rejected for Hero; reused as a river-chapter caption behavior.

## Candidate C — Chaptered immersion / selected

```text
HERO       [100svh full bleed; left-edge thesis]
RECOVERY   [bone field; wetland text sweeps wide; no card]
WETLAND    [86svh full bleed; quote in upper-left quiet water]
RIVER      [100svh full-bleed media + offset field-note caption]
CITY       [110svh full bleed; title lower-left; subject center-right]
ACTION     [bone calm field; three horizontal commitments, no cards]
FOOTER     [peat quiet ending]
```

Selected because it preserves the full-bleed Hero, creates more than two contrast beats, and gives each video a different narrative role rather than alternating identical rectangles.

## Section anchors and density

1. Hero: dense visual / sparse copy; title left at y≈38%, action left at y≈72%.
2. Wetland prelude: pale recovery; title spans 6 columns, body spans 4 columns.
3. Wetland media: immersive; short quote in measured upper-left quiet zone.
4. River chapter: tactile/full-bleed; media fills one viewport behind a narrow observation rail. A QA revision removed the extra sticky scroll tail because it created a blank dark band in the required full-page capture.
5. City chapter: immersive/dusk; title lower-left, rain-garden subject right-center.
6. Action: calm, bright; three full-width ruled rows with staggered text, not equal cards.
7. Footer: dense dark strip with a single return gesture.

## Allowed overlaps

- Navigation and text may overlay video only inside declared safe zones.
- Marginal rules and captions may cross from copy field toward media but stop before focal x=52%.
- No cards, metrics, or proof panels over the subject.

## Responsive transformation

- Hero remains full-screen video on phone; copy moves to top 12–47%, subject is preserved below.
- Wetland recovery becomes one column; explicit line breaks preserve 3–6 Han characters per line.
- River layout becomes one 78–100svh full-bleed media beat with copy pinned to a safe band, not a small window.
- Action rows stack internally but remain edge-to-edge ruled bands.
- Navigation collapses to brand + media toggle + section menu button; anchor list appears in a full-screen overlay.

## Typography geometry decision

Approved and locked after real-glyph tests: titles may use 6 columns (instead of 5) within the same copy-safe region. The maximum x boundary remains 50%, so media focal geometry is unchanged. Desktop, 1024px, 768px and 390px screenshots all pass.

## Gate result

PASS. Two full-bleed candidates preserved the Hero contract; the selected chaptered system retains 100% Hero coverage, explicit safe zones and mobile full-media transformations.
