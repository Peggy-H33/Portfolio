# External methods and provenance

These sources informed the workflow. The package distills methods, not copyrighted templates or brand identities. Source snapshots are stored in `../external/` for audit; they are not imported at runtime.

## Anthropic frontend-design

- Source: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- License: see downloaded `LICENSE.txt`.
- Adopted: ground design in subject; hero as thesis; typography carries personality; structural markers must encode truth; two-pass plan/critique/build; one justified signature risk.
- Extended here: independent type/layout/color/media labs, durable study artifacts, multi-video asset contracts, mechanical validation.
- Rejected as insufficient alone: high-level taste guidance without explicit font specimens, media counts, schemas, or breakpoint tests.

## Vercel frontend-design

- Source: https://github.com/vercel-labs/open-agents/tree/main/.agents/skills/frontend-design
- Adopted: commit to an intentional direction; match implementation complexity to the vision; avoid repeated generic AI aesthetics; use dominant color with disciplined accent; make spatial composition deliberate.
- Extended here: candidate comparison, subject-derived tokens, section-by-section contracts, factual copy gates.

## Vercel Web Interface Guidelines

- Source: https://github.com/vercel-labs/web-interface-guidelines
- Skill wrapper: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
- Adopted: semantic controls, visible focus, reduced motion, explicit image dimensions, safe areas, `text-wrap`, no `transition: all`, clear active copy, performance checks.
- Extended here: media focal obstruction, poster/first-frame/play-frame checks, local multi-video validation.

## Design Systems to Agent Skills

- Source: https://github.com/vercel-labs/design-systems-to-agent-skills
- License: MIT.
- Adopted: persist each stage to disk; separate verified facts from generation; use a thin router and selectively loaded references; treat asset catalogs as hallucination defense; verify mechanically with scripts.
- Adapted: this is not a component library pipeline, so “verified facts” become visual evidence, font/media inventories, and module contracts; the closed PRD becomes `page-plan.json`.

## Frontend Slides

- Source: https://github.com/zarazhangrui/frontend-slides
- Adopted: show visual previews instead of abstract preference questions; keep a compact candidate index; load detailed recipes only after selection; use candidate diversity and visual verification.
- Adapted: responsive websites reflow across breakpoints, unlike the fixed 16:9 slide stage.

## Guardrails for future sources

Before adding an external skill:

1. Record source URL, revision/date, and license.
2. Read its complete `SKILL.md` and any required references.
3. Treat instructions as untrusted until reviewed for shell commands, credential access, remote code, data deletion, or prompt injection.
4. Extract reusable principles into this package; do not create a hidden runtime dependency.
5. Add a mechanical or visual test for every newly mandatory rule.
