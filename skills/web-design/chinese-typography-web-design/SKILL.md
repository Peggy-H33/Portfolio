---
name: motion-site-chinese-web-design-v6
description: Audit, select, render, download, license-check, and art-direct expressive Chinese typography across an entire web page. Use for Chinese landing pages, campaigns, music/culture sites, portfolios, ecommerce, SaaS, dashboards, and video-led pages when users want handwritten, calligraphic, floral/script-like, experimental, playful, cinematic, fashionable, or non-rigid Chinese on Hero, section headings, quotes, brands, CTAs, labels, captions, numbers, navigation accents, and other visible text. It supports rich multi-script composition with multiple calligraphic families, requires unique per-element surface IDs and authored Chinese line shapes, and may propose bounded local copy-grid adjustments when real glyphs expose an ugly narrow container while preserving media and macro art direction.
---

# 中文网页字体设计 V6

只负责中文字体与排版。把网页现有艺术方向视为输入和锁，不重新设计页面结构、Hero 媒体、视频裁切、色彩系统或动效。

## 职责边界

允许修改：字体文件、`@font-face`、字体 token、模块字体、真实字重、字号、行高、字距、文字颜色、行宽、对齐、短句断行、fallback 和字体加载策略。

可提议但不能擅自落地：局部 copy-zone 宽度、局部 grid span、局部对齐、section padding/min-height 和展示标题 max-width。必须用真实字形截图证明，并由艺术指导 skill 批准后锁定。

禁止修改：DOM 顺序、section 数量、Hero 视频模式和尺寸、媒体焦点、`object-fit`/`object-position`、视频安全区、宏观网格、页面色板、组件结构、z-index、动效与响应式媒体形态。

与 `motion-site-art-directed-v9` 配合时，先读 [art-direction-handoff.md](references/art-direction-handoff.md)，再读取其 `study/page-plan.json`。宏观媒体合同已锁，但本地文字几何在真实 glyph 验证前保持 provisional。输出 `study/typography-module-plan.json`，不要输出第二份页面计划。

## 核心结果

- 对 landing、product、editorial、portfolio、campaign、音乐、文化和消费品牌页面，默认采用 `distributed`：建立一个最强中文签名峰值，并在至少两个非 Hero 文字表面安排经过实拍验证的表现型字体。章节标题、引语、品牌标、CTA 短语、眉题、编号、图注首词或导航短词都可以成为表达点。
- 必须区分 `script-floral` 与 `expressive-display`。用户明确说“花体、手写、行草、书法、题字、签名感、书写感”时，最终签名字体必须是 `calligraphic` 或 `handwritten`；得意黑、龙珠体、无界黑、圆体、装饰宋体和像素字即使很有个性，也不能单独冒充书写型花体。完整边界见 [signature-intent-taxonomy.md](references/signature-intent-taxonomy.md)。
- 至少一个真实可见的 `hero_display`、`brand_mark` 或 `editorial_quote` 使用主签名展示字体；这只是最高峰，不是花体使用上限。不得因为文字不是 Hero 或不是大标题就自动排除花体、手写体或其他表现字体。
- 完整网页必须覆盖全部可见文字表面，而不是只设计 Hero。品牌、导航、导语、章节标题、正文、引语、数字/年份、CTA、图注、控件和页脚都要有明确的字体角色、真实字重、字号、行高、字距、字色、行宽与 fallback；它们可以共用字体，但不能依赖未记录的默认样式。
- 为主要大字真实比较三个候选：至少两个来自不同的表现型类别，另一个可为克制型对照。不能用三个相似黑体完成 A/B/C。
- 不得以“太中国”“太活泼”“不够稳妥”这类抽象理由拒绝全部花体。必须记录真实字形、主题语义、媒体背景、断行、清晰度或授权方面的具体证据。
- 逐模块选择之后必须做一次全局层级收敛。模块独立不等于每个模块都用不同字体，也不等于 Hero、章节和引语全部复用同一个“安全展示字”。
- 小字号或功能文字采用表现字体时，以真实尺寸、200% zoom、手机、亮暗背景和 fallback 结果决定是否保留；不按“导航/CTA/图注只能中性黑体”这样的固定角色禁令决定。长段、法律、输入内容和关键交易默认进入阅读保护，但也必须记录设计参数。
- 用户说“丰富使用花体、多种花体、全页花体节奏”时进入 `rich-script`：最终至少使用两款真实 `calligraphic`/`handwritten` 家族，并覆盖至少四个非 Hero 元素、三个语义角色和三个非 Hero 页面区域。具体见 [rich-script-composition.md](references/rich-script-composition.md)。
- 每个可见文字元素使用唯一 `data-type-surface`。禁止四个章节共用 `section-heading` 这类重复 ID，因为它会掩盖不同背景、断行和字体选择。
- 所有 signature/support-display 模块必须记录桌面和手机的真实行数组；不得保留无意的单字行、标点独占行或窄列造成的阶梯式断行。
- 所有 signature/support-display 模块必须用最终字体文件、最终 CSS 字号和最终容器内容宽度记录桌面/手机最差 `fit`；`longest_line_width_px` 不得超过 `available_width_px`。这个数值预检不能替代最终页面截图。
- 只下载最终提交的字体和字重。候选试排文件不得进入交付包。

## 最小流程

### 1. 接收艺术方向，不重新定义它

记录 `locale`、页面类型、用户偏好、视觉声音、内容密度、背景明暗、媒体特征和现有锁。若已有页面计划或参考截图，把它们写入 `integration_contract`：`art_direction_locked`、`layout_locked`、`media_locked`、`section_structure_locked` 必须为真。

若只收到“选择中文字体”，可以建立最小模块上下文，但不要创建页面架构、视频计划或第二套视觉方向。

### 2. 盘点全站文字表面

先按 [full-site-typography-coverage.md](references/full-site-typography-coverage.md) 为每个可见文字元素建立唯一 `data-type-surface` 标记和清单，再读 [expressive-distribution.md](references/expressive-distribution.md) 标记表现机会与阅读保护面。若用户要求丰富/多种花体，同时读 [rich-script-composition.md](references/rich-script-composition.md)。完整网页使用 `coverage_audit.scope: full-page`；只有明确限定单个组件时才使用 `component`。

### 3. 为模块取得候选

先读 `references/style-to-font-selection.md`、`references/chinese-font-library.md` 和 `references/display-type-hierarchy.md`。若用户提到花体、手写、行草、书法或题字，再读 [signature-intent-taxonomy.md](references/signature-intent-taxonomy.md)，然后运行：

```bash
python scripts/recommend_module_fonts.py \
  --prompt "低饱和电影感的中文摇滚乐队长页，大字有手写和唱片封套张力" \
  --locale zh-CN \
  --page-type landing \
  --signature-intent script-floral \
  --rich-script required \
  --distribution-mode distributed \
  --expressive-mode required \
  --modules brand_mark,hero_display,section_heading,editorial_quote,body_longform,nav_ui,cta,caption_metadata
```

`--distribution-mode distributed` 会让非 Hero 的章节、引语、品牌、短 CTA、导航短词、图注/元数据和数字模块获得真实表现型候选；它不强制最终全部采用花体。`concentrated` 只用于用户明确要求单一题字峰值，`restrained` 用于高风险严肃场景。`--signature-intent script-floral` 仍严格区分真实书写型与海报展示字。

推荐结果是候选，不是最终字体栈。不得绕过排名后凭字体名称选择；若选择未进入 shortlist 的字体，记录实际渲染为何更好。

### 4. 在原页面环境中真实试排

对主签名和计划采用表现字体的每个非 Hero 模块，使用各自真实中文、真实字号、真实背景和真实容器制作 A/B/C。真实加载字体并用 `document.fonts.check()` 验证。一起调整字号、字距、行高、颜色、行宽、对齐和断行，而不是只切换 `font-family`。如果真实字形暴露出窄列、阶梯断行或局部空间失衡，写入 `geometry_adjustments`，交给 V9 在不动媒体的前提下批准。

检查远距离轮廓、笔画在亮/暗视频上的消失、主体遮挡、移动端孤字、中文标点、英文和数字基线。候选预览不得改变视频框或页面网格。

在截图前对最终提交字体做一次真实 glyph 宽度预检。为每个 signature/support-display 模块记录桌面与手机的代表性最差表面、视口、可用内容宽度、最长行宽与比例；若比例大于 1，先调整字号、明确断行或提出局部 copy-zone 修正。不得用字体标本中的容器代替最终页面容器。

### 5. 建立全局字体节奏

选择一个 `signature_module` 和一个 `signature_font_id` 作为最高峰，再为非 Hero 文字表面建立分布图。表现字体可以复用，也可以按章节选不同家族；决定依据是语义、笔画、字号、背景和全页节奏，而不是“只能出现几次”。默认控制为 2–4 个已提交家族，超过时必须证明每个家族承担不可替代的角色。

长篇正文和关键交互首先承担阅读任务；短正文、CTA、导航短词、眉题、图注首词、编号和状态文字可以承担局部惊艳任务，只要通过真实字号和无障碍验证。详细规则见 [display-type-hierarchy.md](references/display-type-hierarchy.md)。

“分布式”不等于把每个字都变成花体。让表现型文字在不同章节形成可感知的节奏，同时保留足够的安静阅读面。禁止 Hero-only，也禁止随机字体拼贴。

`rich-script` 也不是把一款花体重复到全页。至少两款书写家族必须承担不同语义角色，并用页面区域和全页截图证明其节奏。

### 6. 提交模块计划并只下载使用项

按 `references/typography-module-plan.schema.json` 写入 `study/typography-module-plan.json`，再运行：

```bash
python scripts/validate_typography_plan.py study/typography-module-plan.json --html index.html
python scripts/download_open_fonts.py ./site --fonts <committed-font-ids>
```

`committed_font_ids` 必须与模块实际使用的唯一字体完全一致。品牌或专有字体只从官方来源取得，并遵守 `references/official-test-fonts.md`；内部测试文件不得进入 skill、公共仓库、CDN 或正式交付。

`--html` 对完整网页是必需的：校验器会把 DOM 中的可见文字、`coverage_audit` 清单和 `modules[].surface_ids` 三方对账，任何漏项或重复归属都会失败。

### 7. 只合并字体覆盖

以模块 token 应用结果：

```css
:root {
  --type-signature: "Selected Expressive Face", cursive;
  --type-section: "Selected Section Face", sans-serif;
  --type-quote: "Selected Quote Face", cursive;
  --type-accent: "Selected Small Accent Face", sans-serif;
  --type-reading: "Selected Reading Face", sans-serif;
  --type-ui: "Selected UI Face", sans-serif;
}
```

把 token 接到现有选择器，不重写 Hero 或 section CSS。允许在复制安全区内调整文字 `max-width` 和断行；需要移动媒体或扩大容器时停止并交还艺术指导 skill。

### 8. 视觉验收

至少检查 1440×900、1024×768、390×844、200% zoom、字体失败 fallback、首帧和亮/暗视频帧。确认：

- 签名字体真实出现，不是 fallback；
- 最大中文文字具备主题辨识度，不再像默认企业黑体；
- 中文没有被巨大的 Latin 品牌字降为次要说明；
- Hero 媒体面积、主体位置和页面节奏与接入前一致；
- 明确的花体/手写要求由真实 `calligraphic` 或 `handwritten` 字体承担短语义；海报黑体、圆体或像素字不能冒充，并保留清楚的正文/操作文字；
- `distributed` 页面至少有两个非 Hero 表面真实使用表现字体，其中至少一个来自非大标题角色；它们在桌面、手机、200% zoom 与 fallback 状态均可辨认；
- `rich-script` 页面满足两款书写家族、四个非 Hero 元素、三个角色、三个非 Hero 区域，并且没有无意单字行；
- 品牌、导航、导语、章节标题、正文、引语、数字/年份、CTA、图注、控件和页脚均出现在覆盖计划中，且各自参数与阅读任务一致；
- 字体下载清单、许可证和最终 CSS 完全一致。

自动结构检查不能替代截图判断。

## 禁止的捷径

- 用“现代、工业、冷峻、编辑感”掩盖用户明确要求的手写或花体大字，或用得意黑等海报展示字声称已经满足书写型花体。
- 把女性编辑、香氛或手作字体机械用于摇滚、工业或动作主题。
- 把同一个安全展示字体分配给 Hero、全部章节和全部引语。
- 只让一个小 `<em>` 使用花体，而最大的中文主句仍是默认黑体，却声称已完成字体设计。
- 只提交 Hero 的字体记录，或让全站其余文字落入未审计的 `body` 默认字体。
- 把“正文/UI 要可读”误写成所有导航、CTA、图注、眉题和短句都必须使用同一中性黑体。
- 用一款花体在 Hero、两处引语中重复，便声称已经“丰富使用花体”。
- 让多个 DOM 元素共用同一 `data-type-surface`，从而跳过逐章节字形和断行判断。
- 因为艺术方向先锁而容忍窄列阶梯断行；应先提出有边界的局部文字几何调整。
- 为满足分布数量，随机给每个模块换一种花体，造成字体拼贴、层级竞争或长文不可读。
- 让最大 Latin 字抢走中文签名层级，除非品牌名本来就是唯一主角。
- 为字体适配把全屏视频缩成右上角窗口、下半屏媒体或普通卡片。
- 下载所有候选、使用未授权字体、接受 fallback 截图，或用特效掩盖不合适的字形。

## 资源

- 模块候选与全局层级：`references/style-to-font-selection.md`、`references/chinese-font-library.md`、`references/display-type-hierarchy.md`
- 与艺术指导 skill 的边界：`references/art-direction-handoff.md`
- 字体目录、授权与接入：`references/font-catalog.yaml`、`references/web-font-recipes.md`、`references/official-test-fonts.md`
- 中文字形与混排：`references/zh-typography.md`
- 花体意图分类与强制门槛：`references/signature-intent-taxonomy.md`、`references/decorative-fonts.md`
- 全站可见文字表面与自动对账：`references/full-site-typography-coverage.md`
- 表现字体的跨章节分布与小字号可读性：`references/expressive-distribution.md`
- 多书写家族、唯一区域与行形门槛：`references/rich-script-composition.md`
- 模块计划：`references/typography-module-plan.schema.json`
- 推荐、验证、下载：`scripts/recommend_module_fonts.py`、`scripts/validate_typography_plan.py`、`scripts/download_open_fonts.py`
- 字体标本：`assets/font-library-preview.html`、`assets/decorative-font-preview.html`
