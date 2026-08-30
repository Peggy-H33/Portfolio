# 03 Typography lab

## Integration contract

- locale: `zh-CN`
- page type: cinematic landing / editorial campaign
- visual voice: 湿润、缓慢、手作观察、诗意但不玄虚
- media: full-bleed dark/bright ecological video
- distribution mode: `distributed`
- signature intent: `script-floral` (font recommender inferred from the authored “田野笔记、温润手写” brief)
- rich-script: off; two writing families are still used because they serve distinct ecological semantics.
- locks: `art_direction_locked=true`, `layout_locked=true` at macro level, `media_locked=true`, `section_structure_locked=true`.
- font family state: `unlocked-for-typography-lab` → selected below from real glyph evidence.
- typography geometry: `locked-after-real-glyph-test` after final-page screenshots and measured fit metrics.

## Voice mapping

- 水的连续性 → 连笔、松弛的行草轮廓。
- 土壤与根系的重量 → 较厚、有分叉笔锋的毛笔字。
- 观察记录 → 小字号字距、坐标、细线与克制系统字。
- 公共可读性 → 长文和媒体控制使用清晰系统无衬线。

## Real candidates

The A/B/C lab is preserved in `study/screenshots/type-lab-desktop.png` and `type-lab-phone.png`; all three files were loaded and `document.fonts.check()` returned true.

### A — 龙藏体 / Long Cang / SIL OFL 1.1

- Category: handwritten.
- Real text: “一滴雨 / 回家的路”“让湿地重新呼吸”“水慢下来，生命才有时间发生。”
- Parameters: Hero 64–136px desktop / 74px phone, line-height .82–.9, loose negative space, warm bone color.
- Result: selected as `signature_font_id=long-cang`. The long lateral strokes echo water paths and remain legible over the dark habitat field.
- Constraint: only 2–10 character display phrases; never long reading or critical controls.

### B — 马善政体 / Ma Shan Zheng / SIL OFL 1.1

- Category: calligraphic.
- Parameters: Hero 52–112px desktop / 58px phone, line-height .93; section display 30–62px.
- Result: selected as support display. Its denser branches and grounded ink weight suit soil, roots, action verbs, and section transitions without competing with the looser Hero signature.
- Constraint: short section phrases and action labels only.

### C — 站酷小薇体 / ZCOOL XiaoWei / SIL OFL 1.1

- Category: handwritten/editorial control.
- Result: rejected. The real specimen produced visible missing-glyph squares in “回家的路” at both desktop and phone, so locale coverage fails despite its otherwise calm editorial silhouette.

## Global hierarchy

- `signature_module`: `hero_display`
- `signature_font_id`: `long-cang`
- `signature_style_category`: `handwritten`
- strongest peak: `hero-title`
- second family: `ma-shan-zheng` for section titles, action title and short CTA echoes.
- reading base: local `Source Han Sans SC` variable font with `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif` fallback.
- active delivered font families: 3 local, including one reading family and two expressive families.

## Distributed expressive map

- Hero peak: `hero-title` → Long Cang.
- Non-Hero region 1: `wetland-title`, `wetland-quote` → Ma Shan Zheng / Long Cang.
- Non-Hero region 2: `river-title`, `river-caption` → Ma Shan Zheng / Long Cang.
- Non-Hero region 3: `city-title`, `city-note` → Ma Shan Zheng / Long Cang.
- Non-Hero region 4: `action-title`, `action-cta` → Ma Shan Zheng.
- Non-heading expressive roles: editorial quote, field-note caption, city handwritten note, CTA phrase.

## Reading-protected surfaces

`skip-link`, `hero-intro`, `hero-cta`, `wetland-body`, `river-body`, `city-body`, `action-intro`, all three action-item bodies, media button state, footer note and return control remain in local Source Han Sans SC with neutral fallbacks.

## Final unique surface inventory

The reconciled inventory contains 47 visible text elements, including skip link, brand/submark, four nav links, media/menu controls, all Hero and chapter text, three action indices/titles/bodies, CTA, footer brand/note/return. The exact IDs and one-owner mapping are recorded in `study/typography-module-plan.json`; V6 HTML coverage validation reports 47/47 with no duplicate marker.

## Early line-shape target

- Hero desktop: `["一滴雨", "回家的路"]`; phone: `["一滴雨", "回家的路"]`.
- Wetland title desktop/phone: `["让湿地", "重新呼吸"]` / `["让湿地", "重新呼吸"]`.
- River title: `["河流", "记得方向"]` desktop and phone; field caption: `["绕行，", "也是抵达。"]`.
- City title: `["把城市", "还给四季"]` desktop and phone.
- Action title: `["留下一小块", "会呼吸的地方"]` desktop; `["留下一小块", "会呼吸的地方"]` phone.

No single-character or punctuation-only display line is intended.

## Geometry proposal to V10

Approved after real-page captures: title copy zones may expand from 5 to 6 of 12 columns inside the same subject-safe field. Phone wetland quote and action title received a 2–6px local size reduction after measured ratios of 1.116 and 1.014; city note and river caption received explicit phrase-preserving line breaks. At 1024px the Hero title changed from 122.9px to 102.4px and locked each authored line after the third line became a lone “路”. Media boxes, focal positions, section order and macro grid remain unchanged.

## Gate status

PASS. Real candidate glyphs, 47/47 surface reconciliation, exact desktop/phone width metrics, 1024px tablet, 200% zoom, fallback, bright/dark and phone screenshots all pass. The final V6 validator reports 9 modules, 47 surfaces, 3 fonts, 14 expressive surfaces and 13 non-Hero expressive surfaces.
