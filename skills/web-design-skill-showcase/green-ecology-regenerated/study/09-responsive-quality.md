# 09 Responsive, accessibility and performance

## Breakpoint transformations

### 1440×900

- 12-column grid, 5vw gutters, full-bleed Hero and city chapter.
- Hero title occupies x 5–44%, y 28–66%; video object-position 50% 50%.
- Wetland recovery uses 7/4 column asymmetry; river media is a 100svh full-bleed chapter.
- Action rows use 3/3/6 column internal alignment and vary the title offset.

### 1024×768 / 768 wide

- 8-column grid, 32px gutters.
- Copy zones remain on the same edge but gain one column; long body moves below headings.
- River remains a full-viewport media beat; the observation rail overlays only the dark upper-left rock zone.
- Navigation spacing contracts; all four anchors remain visible at 1024, mobile menu begins below 760.

### 390×844 / 360 wide

- 4-column grid, 20–22px gutters, safe-area insets honored.
- Hero remains 100svh full-bleed; video object-position 53% 50%. Title uses the quiet upper-left sky/fog band at y 15–36%, while birds/reeds shift right and remain visible from y≈32% downward.
- Wetland recovery reflows to one column; full-bleed quote chapter remains 82svh.
- River becomes a 78svh full-width media field with copy in a lower directional scrim, not a small video window.
- City remains 100svh full-bleed, object-position 70% center; title stays over the left concrete field.
- Action rows stack label/title/body internally and preserve large ruled touch areas.
- Desktop anchor list becomes a modal-like menu; brand and motion toggle stay visible.

### Wide / short viewports

- Content max width 1480px; title never expands past x=50%.
- At heights below 640px, Hero copy scales down and vertical gaps compress; it does not force scrolling within a fixed viewport.

## Display line targets

- Hero: 2 lines desktop and phone, no one-character line.
- Wetland: 2 lines desktop/phone.
- River: 2 authored lines desktop and phone.
- City: 2 lines desktop/phone.
- Action: 2 lines desktop/phone.

## Accessibility

- Landmarks: skip link, nav, main, section headings in order, footer.
- Every control has a visible text label and `aria-pressed`/`aria-expanded` state.
- Videos are decorative, muted and `aria-hidden=true`; all meaning is repeated in text.
- Focus ring uses `#D9FF91` plus offset; 44px minimum touch targets.
- `html` preserves zoom; layouts are tested at 200% without horizontal scroll.
- Motion is never the only carrier of information.

## Performance budget

- Preload only Long Cang (critical Hero face) and Hero poster; Ma Shan Zheng uses swap without preload.
- Hero video `preload=metadata`; chapter videos omit declarative autoplay and use `preload=none`.
- Poster is always present below video and fixes aspect/coverage before decode.
- An IntersectionObserver marks media near the viewport, begins playback only when at least 12% visible, and pauses it offscreen; a `currentSrc` guard prevents duplicate requests.
- Only the in-view video plays automatically; all videos remain muted/playsinline/loop.
- Three final local font files are shipped: two expressive 400 faces and one Source Han Sans SC reading variable face; rejected candidate bytes are not shipped.

## No-JS / failure behavior

- Posters and all text are visible in normal document flow.
- Reveal elements are hidden only after JS adds `.js` to `<html>`; otherwise content never disappears.
- Video error keeps poster and updates the global control to “部分影像不可用”.

## Gate state

PASS. Final screenshots verify keyboard focus, open/close mobile menu, phone crop, 200% zoom, fallback, reduced-motion default and explicit play override; the cold-load audit requests only the Hero MP4.
