# Distillation ledger

Use one row per evidence item. This prevents a reference-specific detail from silently becoming a universal rule.

| Field | Meaning |
|---|---|
| evidence_id | stable local identifier |
| source | prompt file, screenshot, URL, or generated test |
| observed | directly visible or verifiable fact |
| inferred | interpretation, clearly labeled |
| dimension | content, type, layout, color, media, component, motion, responsive |
| context | viewport, page region, interaction state |
| confidence | high / medium / low |
| reusable_rule | frontend-friendly implementation rule |
| alternative_rule | conflicting good treatment from another template |
| selection_condition | when to choose each alternative |
| anti_pattern | failure the rule prevents |
| test | mechanical or screenshot-based acceptance check |

## Conflict policy

When two good sources design the same module differently, keep both variants. Do not average them into a vague rule. Record the condition that chooses between them, for example:

- full-bleed hero video + edge-aligned copy when the subject has a known empty side;
- contained editorial film with adjacent copy when both the subject and copy need full contrast;
- centered copy only for abstract/peripheral video with a verified central quiet zone.

## Promotion policy

An observation becomes a mandatory rule only if it is supported by:

- accessibility or browser behavior;
- a repeated pattern across independent sources;
- a validated failure from prior generated pages; or
- an explicit user preference.

Otherwise store it as an optional variant with a selection condition.
