# 07 Components and copy

## Global navigation

- Answers: “我在故事的哪里，能否快速去往某个生态场景？”
- Content: brand “循绿 / BACK TO THE LIVING LOOP”, anchors “湿地 / 河流 / 城市 / 行动”, motion toggle.
- Semantics: `<nav>`, real anchor links, `<button>` for motion/menu. Skip link precedes it.
- Geometry: transparent fixed rail on desktop; brand + motion + menu on phone. Open phone menu is a full-screen peat overlay with safe-area padding and focus return.
- States: white/bone default; acid-green current underline; visible 2px focus ring. Removed only for print.

## Hero thesis

- Answers: “这个页面为什么值得继续看？”
- Copy: `一滴雨 / 回家的路`；导语“当水愿意停留，土地开始呼吸，城市也重新听见四季。”
- Source: original conceptual copy grounded in visible wetland film; no unsupported metric.
- Semantics: `<header>`, `<h1>`, anchor CTA “沿着水走下去”.
- Visual priority: highest typography peak after the wetland itself.
- Media relationship: title boundary x≤44%; no content over egrets/reeds x≥58%.

## Wetland recovery + immersive quote

- Answers: “生态修复为什么从慢下来开始？”
- Copy: “水不必立刻离开。浅滩、草根与泥土，把一次急促的降雨变成缓慢的停留。”
- Quote: “水慢下来，生命才有时间发生。”
- Semantics: `<section>`, `<h2>`, paragraph, `<blockquote>`.
- Mobile: recovery copy becomes one column; quote sits in upper band of wetland poster/video.

## River memory chapter

- Answers: “连接如何在自然系统里发生？”
- Copy: “溪流绕过石头，穿过根系，也把养分、种子和低处的生命带在一起。修复，不是把水管得更直，而是让它重新拥有转弯的空间。”
- Caption: “绕行，也是抵达。”
- Semantics: `<section>`, sticky media wrapper, heading/body/caption.
- Desktop: observation rail; phone: 72svh full media with lower text band.

## City symbiosis chapter

- Answers: “生态循环如何回到城市日常？”
- Copy: “一条浅沟、一片透水的地面、一组顺着季节生长的植物，都能把雨从负担变成邻居。”
- Note: “城市不是自然的反面，它只是需要重新学会留白。”
- Semantics: `<section>`, full-bleed video, heading/body/aside note.
- Media safety: copy stays on left concrete/paving field; bioswale remains right-center.

## Action rows

- Answers: “我现在能做什么？”
- Content, ordered by physical scale:
  1. `留一寸土` — 把一小块硬质地面换成可渗透的土与碎石。
  2. `种回本地` — 选择适应当地雨量与季节的乡土植物。
  3. `让雨停留` — 用浅沟、花园或容器，让屋面雨水就近回到土地。
- Semantics: ordered list with three full-width ruled rows; not cards. Each row can receive keyboard focus via its internal anchor.
- CTA: “从一小块开始” scrolls back to item 1 and briefly marks it.
- Empty/error/loading: none; static local content.

## Media control

- Answers: “我能否暂停持续运动？”
- Semantics: one global `<button aria-pressed>` controls all videos. Text state is explicit “暂停影像 / 播放影像”.
- Reduced motion: initial paused poster state; explicit user press reveals and plays all videos. Press again returns to poster-backed paused state.
- Error: poster remains visible; status becomes “部分影像不可用”.

## Footer return

- Answers: “故事如何安静结束并允许重来？”
- Copy: “把水还给土地，也把四季还给生活。” + “回到源头”.
- Semantics: footer + real anchor to `#top`.

## Removed modules

- No unsupported impact metrics, partner logos, testimonials or certification badges.
- No floating proof cards on Hero.
- No newsletter form or decorative social buttons.

## Gate result

PASS. Every planned visible component has a content question, semantic behavior, responsive transformation and removal condition; no generic card grid is included.
