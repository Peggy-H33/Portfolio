# QA report

| Severity | Viewport/state | Screenshot | Finding | Fix | Recheck |
|---|---|---|---|---|---|
| P1 | 390 phone | fullpage-phone.png | 章节 `figure` 默认外边距与 72svh+aspect-ratio 共同造成 156px 横向溢出 | 清零 figure margin；手机媒体改为明确 width/height，不由 aspect-ratio 反推宽度 | pass，overflow 0px |
| P1 | 390 phone | fullpage-phone.png | 结尾题名曾出现“来，”单字阶梯 | 将手机结尾字号收至 62.4px 并保留两条语义断行 | pass，2 lines |
| P1 | 1440 desktop | lane-desktop.png | 里弄引语末尾“路。”曾孤立换行 | 龙藏体从 4vw 收至 3.35vw | pass，1 line，ratio 0.851 |
| P2 | 1440/390 | fullpage captures | 深层 tea still 在全页浏览器截图中未触发 lazy decode | 导出 263KB JPEG，并改为非懒加载章节静帧 | pass，桌面与手机均出现 |
| P2 | all | final-desktop.png | v10 初次机械校验只有两段最终视频 | 生成独立“雨夜夜床” outcome 视频并加入结尾 | pass，3 videos / 3 roles |

## Mechanical validation

- `motion-site-art-directed-v10/scripts/validate_output.py .`: PASS videos=3 sections=7 warnings=0
- `motion-site-chinese-web-design-v6/scripts/validate_typography_plan.py … --html index.html`: PASS modules=9 surfaces=65 fonts=3 distributed expressive=6 non_hero=6
- Browser console/page errors: 0
- Font readiness: true at 1440 / 768 / 390
- Unique marker check: 66 markers / 66 unique（含默认隐藏的提交状态）；V6 默认可见覆盖 65 / 65
- Horizontal overflow: 0px at 1440 / 768 / 390

## Type review

- Hero: desktop 2 lines, fit 0.654；phone 3 semantic lines, fit 0.705
- Signature manifesto quote: desktop fit 0.990；phone fit 0.983；both 2 semantic lines
- Lane title: desktop fit 0.888；phone fit 0.867；both 2 semantic lines
- Lane quote: desktop/phone both 1 line after correction
- Closing title: desktop/phone both 2 semantic lines；no single-Han or punctuation-only line
- A/B/C font lab and fallback/zoom captures exist

## Layout/obstruction review

- Hero text remains entirely inside the declared left safe zone; skyline, curtain and lamp remain readable.
- Lane copy sits in a separate column and never covers the opening door or rain action.
- Final copy occupies the center dark region; double scrim preserves text contrast while the lamps, rain window and bed remain legible.
- Full-page desktop/phone captures show seven sections with deliberately different silhouettes.

## Hero contract and baseline regression review

- Locked mode: cinematic-full-bleed
- Declared/observed desktop media coverage: target 1.000 / observed 1.000
- Baseline source and same-viewport comparison: no prior project baseline；first accepted Hero capture is `qa/hero-playing-desktop.png`
- Protected qualities preserved: Shanghai skyline, hotel bed, brass light, breathing curtain, left copy-safe darkness
- Typography merge changed media/layout/sections: no；only bounded copy width, font metrics and semantic breaks changed

## Color/media-frame review

- Neutral material share dominates; brass is a small accent and never becomes a full-screen flat wash.
- Hero, lane and closing first/middle/last frames are saved and visually distinct.
- Two ImageGen stills are unique chapter assets, not duplicates or crops of the generated video.

## Media diversity and fallback review

- Authentic temporal motion gate: pass for all three final assets
- Provenance sidecars agree with media plan: yes
- Static-transform-only MP4 count: 0 among final assets
- Reduced-motion default / explicit-play override: poster-first and per-video play verified；global motion toggle sets `data-motion=reduced`, `aria-pressed=true`, and pauses all videos
- Ambiguous tea-video attempt is documented but excluded from the final moving-image manifest; its static ImageGen fallback is labeled as static in-page.

## Accessibility/performance review

- Keyboard focus style, skip link, native dialog, labels, semantic landmarks and a single h1 are present.
- `prefers-reduced-motion` and a visible global motion toggle are implemented.
- Interaction regression: selector changed to “把讲究留在房间里”；dialog generated the local-only summary and did not send data.
- Hero uses metadata preload；lane/closing use `preload=none` and viewport-near source loading；posters remain underneath video.

## Completion

- Blockers open: 0
- Majors open: 0
- Final status: PASS / ready for local static-server review
