# Visual QA report

日期：2026-08-21  
页面：循绿｜一滴雨回家的路  
目标：motion-site-art-directed-v10 × motion-site-chinese-web-design-v6 最终成品门禁

## 结论

PASS。最终复检没有 Blocker 或 Major。页面保留 100svh 电影化全屏 Hero、三段互不重复的真实时序视频、分布式中文表现字体、完整手机转化、可暂停/可显式恢复的 reduced-motion 行为和无水平溢出的 200% 缩放状态。

## 截图矩阵

| 场景 | 路径 | 结果 |
| --- | --- | --- |
| 1440×1000 顶部 | `study/screenshots/desktop-top-final.png` | PASS；主标题与白鹭分处左右安全区 |
| 1440×1000 河流中段 | `study/screenshots/desktop-river-final.png` | PASS；标题、正文、边注均未遮挡主水流 |
| 1440×1000 底部 | `study/screenshots/desktop-bottom-final.png` | PASS；浅色行动尾声进入暗色页脚，无空白断层 |
| 768×1024 顶部 | `study/screenshots/tablet-top-final.png` | PASS；Hero 仍为两条语义行 |
| 768×1024 河流 | `study/screenshots/tablet-river-final.png` | PASS；媒体、正文与边注层级清楚 |
| 390×844 顶部 | `study/screenshots/phone-hero-final.png` | PASS；全屏媒体没有退化成下半屏小窗 |
| 390×844 目录打开 | `study/screenshots/phone-menu-final.png` | PASS；品牌、暂停状态、关闭按钮与四个目的地可见 |
| 390×844 河流 | `study/screenshots/phone-river-final.png` | PASS；没有标题阶梯断行或媒体主体遮挡 |
| 390×844 城市 | `study/screenshots/phone-city-final.png` | PASS；水沟、雨水花园、标题和观察句同时可见 |
| 桌面 reduced motion | `study/screenshots/reduced-desktop-final.png` | PASS；默认使用海报且显示播放控制 |
| 手机 reduced motion | `study/screenshots/reduced-phone-final.png` | PASS；默认静止、文案完整 |
| 手机 reduced-motion 显式播放 | `study/screenshots/reduced-phone-explicit-play-final.png` | PASS；用户操作后原生视频恢复播放 |
| 200% 缩放 | `study/screenshots/zoom-200.png` | PASS；可用、无水平滚动和单字孤行 |
| 字体阻断回退 | `study/screenshots/fallback-desktop.png`、`fallback-phone.png` | PASS；中性回退保持完整内容与语义断行 |
| 键盘焦点 | `study/screenshots/focus-final.png` | PASS；主 CTA 焦点轮廓可见 |
| 最终整页轮廓 | `study/screenshots/fullpage-desktop.png`、`fullpage-phone.png` | PASS；色彩预算、节奏和章节轮廓完整 |

## 发现、修复与复检

| 严重度 | 发现 | 修复 | 复检 |
| --- | --- | --- | --- |
| Major（已解决） | 初版河流使用长 sticky 尾段，整页截图出现无内容暗带 | 改为正常文档流中的 100svh 全屏电影章节，媒体仍保持 full-bleed | 最终桌面/手机整页截图无空白断层 |
| Major（已解决） | 1024px 真实龙藏体曾把 Hero 的“路”挤成单汉字第三行 | 锁定两个语义 span、扩大局部跨列并为 760–1100px 设置真实字形字号上限 | `tablet-v2.png` 与 `tablet-top-final.png` 均为“一滴雨 / 回家的路” |
| Major（已解决） | 手机湿地观察句、城市观察句与行动标题接近容器极限 | 仅调整局部 `max-width`、字号和明确短语断行，不改变媒体与宏观网格 | 最紧手机宽度比为 0.974；详见 `study/type-fit-metrics.md` |
| Minor（已解决） | 河流边注依赖自然折行，有产生标点悬挂的风险 | 写成“绕行， / 也是抵达。”两个短语 span | 桌面比 0.753、手机比 0.971，无纯标点行 |
| Major（已解决） | 首轮手机目录层级覆盖了关闭控制 | 将目录层留在导航栈底层，品牌与操作栈置顶；打开时标签改为“关闭” | `phone-menu-final.png` 中关闭按钮可见；脚本断言 open/close aria 状态正确 |
| Minor（已解决） | 加入规范 `<source>` 后，媒体脚本可能重复设置同一 Hero URL | `loadMedia` 优先检查 `currentSrc`；移除折下视频的声明式 autoplay | 冷启动只请求 Hero；到河流时仅新增河流，城市仍 readyState 0 / paused |

## 字体门禁

- 本地字体：Long Cang 400、Ma Shan Zheng 400、Source Han Sans SC 100–900，`document.fonts` 全部为 loaded。
- 全页 47 个可见文本表面均有唯一 `data-type-surface`，覆盖 47/47，无重复所有权。
- 表现性表面共 14 个，其中非 Hero 13 个，跨湿地、河流、城市、行动和页脚；长正文和关键操作保持阅读保护。
- A/B/C 真实文案实验保留在 `type-lab-desktop.png` 与 `type-lab-phone.png`；ZCOOL XiaoWei 因出现缺字方块被拒绝。
- 所有 signature / support-display 模块的桌面、手机最宽行与容器比均 ≤ 1；没有非意图的单汉字行或纯标点行。
- 表现性行动 CTA 在 21px / 22px、手机、200% 缩放、亮/暗邻接和字体回退下均通过。

## 媒体门禁

- 三个视频 SHA-256 不同，均为 SenseAudio `doubao-seedance-2-0-260128` 原生 H.264 MP4，1280×720、约 8.04 秒。
- Hero：白鹭翼形变化、涟漪扩张、芦苇摆动、雾与反光变化。
- 河流：水流、泡沫、涡旋、叶片、苔藓与水下焦散连续变化。
- 城市：沟渠水流、草本摆动、行人位置和湿地反射连续变化。
- 每条视频均有首/中/末帧、任务 ID、模型、来源类型、处理历史和人工时序复核；freeze > 1 秒与突兀场景切换检测均为 false。
- Hero 通过无关品牌替换测试，桌面媒体覆盖目标与实际均为 1.0，白鹭/芦苇主体区和左侧文案安全区在桌面、平板、手机均复核通过。

## 响应式、色彩与可访问性

- 文档宽度等于 1440px 与 390px 两个对应视口宽度，无水平滚动。
- 页面主要面积由泥炭绿、雾纸白和真实自然材料色构成；高饱和荧光绿只用于眉题、进度与状态信号，没有连续纯强调色屏幕。
- 导航、媒体控制和 CTA 使用语义元素；媒体按钮同步 `aria-pressed` 与全局 `data-motion`。
- 手机目录打开后焦点进入首个链接，按钮可再次关闭，Escape 可关闭并把焦点还给按钮。
- 交互目标最小高度 44px；全局 `:focus-visible` 使用 2px 高对比轮廓。
- reduced motion 默认保留海报和全部内容，并允许用户通过同一媒体按钮显式播放真实视频。

## 机械校验

- V10 `validate_output.py`：PASS（3 videos / 6 sections / 0 warnings）。
- V10 `validate_skill_package.py`：PASS。
- V6 `validate_skill_package.py`：PASS（typography-only boundary verified）。
- V6 `validate_typography_plan.py --html index.html`：PASS（9 modules / 47 surfaces / 3 fonts）。
- V6 typography JSON Schema：PASS。
- V10 page-plan 与 media-plan JSON Schema：PASS。
- `node --check script.js`：PASS。
