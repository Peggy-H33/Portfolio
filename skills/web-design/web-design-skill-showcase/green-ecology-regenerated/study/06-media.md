# 06 Multi-video media system

## Density

Standard cinematic: three distinct 8-second, 16:9, 720p local videos. No asset is reused under another filename.

## Role 1 — Hero atmosphere / wetland awakening

- Subject: dawn wetland with shallow reflective water, native reeds, a small group of egrets and drifting mist.
- Intrinsic motion required: reeds bend independently in wind; mist curls and thins; ripples travel across water; birds lift and change wing shape; light reflections evolve.
- Camera: nearly locked 24mm documentary frame, extremely slow forward drift only as support.
- Focal coordinates: ecological activity x 58–90%, y 28–86%; quiet copy field x 0–44%.
- Loop: stable exposure, no cut; last frame returns to similar mist density and bird spacing.
- Why subject-specific: it visibly joins water retention, wetland plants, birds and atmospheric exchange in one living habitat.

## Role 2 — Process macro / river memory

- Subject: clear mountain stream moving around moss-covered stone, roots and fallen leaves.
- Intrinsic motion required: water eddies and bubbles deform continuously; leaves flutter; moss tips tremble; underwater caustics shift.
- Camera: low 50mm close environmental view, gentle lateral slide.
- Focal coordinates: stream path x 20–84%, y 20–88%; copy-safe upper-left dark rock x 0–36%, y 8–38%.
- Loop: continuous current without cuts.
- Why subject-specific: it shows ecological connectivity as actual water movement through soil, root and stone, not an abstract green motif.

## Role 3 — Context environment / city symbiosis

- Subject: contemporary Chinese city block after rain with a planted rain garden, permeable paving, curb cut, grasses and pedestrians.
- Intrinsic motion required: rainwater drains from paving into the garden; grasses sway; droplets fall; pedestrians and bicycle move naturally; reflected clouds brighten.
- Camera: human-height 35mm slow track; city remains quiet and believable.
- Focal coordinates: rain garden and moving water x 52–92%, y 42–92%; copy-safe x 4–44%, y 16–64%.
- Loop: soft drizzle and stable traffic, no abrupt cut.
- Why subject-specific: the rain garden, curb inlet and permeable edge make urban ecological infrastructure visible at pedestrian scale.

## Shared exclusions

No text, logos, UI, border, split screen, neon green graphics, fantasy giant leaves, time-lapse morph, abrupt cut, exposure flicker or static poster pan. Silent background use; no generated audio.

## Provider

SenseAudio text-to-video using `doubao-seedance-2-0-260128`, 8s, 720p, 16:9, no watermark. Adjacent provider JSON files contain the final task IDs, provenance and reviewed first/middle/last-frame temporal evidence.

## Generated outputs and review

- `hero-wetland.mp4` — task `4d262311-56ad-410a-b837-838c8e4d29e7`; first/middle/last frames show two egrets taking off, new expanding ripples, reed motion and changing mist. Left 44% remains quiet. PASS.
- `river-memory.mp4` — task `30bd1fa2-a36e-4632-bd78-b61d6d6e0401`; water, foam, leaf positions, moss and caustic light change continuously. PASS.
- `city-rain-garden.mp4` — task `4dd6cb33-e625-4794-ab79-bf82d0f454c1`; channel water, rain-garden grasses, pedestrian and reflections change. Left concrete/paving zone remains available to copy. PASS.

All three decode as H.264 yuv420p, 1280×720, 24fps, 8.041667s. FFmpeg freeze detection (`n=0.003:d=1`) and scene-cut detection (`t=18`) produced no freeze or abrupt-cut event. Playback is silent and provider-native MP4 bytes remain unmodified.

## Gate state

PASS. Three distinct delivery-eligible text-to-video assets, posters, provenance sidecars and reviewed temporal evidence exist. Hero passes the unrelated-brand substitution test because the wetland water, reeds, egrets and habitat-scale interaction cannot plausibly sell an unrelated speaker, perfume or generic SaaS product.
