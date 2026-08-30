# Responsive and quality

| Section | 1440 | 768 | 390 | Media crop/containment | Reduced motion | Loading |
|---|---|---|---|---|---|---|
| Hero | 100svh full bleed；copy 4/12 | copy 5/12 | 100svh；三行主句 | cover；72%/54% → 68%/52% | poster 默认 + 显式播放 | poster preload；video metadata |
| 宣言/时刻 | 12 列错位 | 8 列 | 单列 + 垂直时间轨 | none | 无影响 | static |
| 江岸高处 | 95vh 近满幅 | 70/30 | 100svh full-bleed still | cover，主体右侧 | still | optimized JPEG |
| 里弄私宅 | 7/5 交错 | 1/1 | media 68svh + copy | cover，门洞居中 | poster + 显式播放 | preload none / viewport-near |
| 海派客房 | 5/7 反向 | 1/1 | 4:5 still + copy | object-position 58% | still | optimized JPEG |
| 选择器 | 12 列 rail | 8 列 | 单列按钮 | none | 无影响 | static |
| 结尾 CTA | 100% outcome video | 100% outcome video | 86svh full-bleed | center/58% crop + double scrim | poster + 显式播放 | preload none / viewport-near |

## Accessibility contract

语义 landmarks 与单一 h1；skip link；focus-visible；按钮 44px 触控目标；原生 dialog 焦点管理与 Escape；所有视频按钮有 aria-label；全局动效开关同步 `aria-pressed`；正文 17px 起；不以颜色或运动单独传递信息；支持 200% zoom。

## Performance budget

首屏 preload 展示字体与 Hero poster；Hero 视频 metadata，章节视频 preload none 并在接近视口时加载；离开视口即暂停；poster 固定尺寸防止布局跳动；两张静帧转换为 373KB / 263KB JPEG；只提交实际字体文件/字重。

## Edge cases

- 200% zoom: 导航允许换行，标题 clamp 下限不小于 48px，内容不截断。
- long copy: 正文 max 31 个汉字，选择器详情 min-width:0。
- missing font: SC serif/cursive fallback 保留内容，已生成 `qa/font-fallback-desktop.png`。
- video failure: poster 常驻底层，error 后保持 poster 和可读文案。
- no JavaScript: poster、默认选择器内容与完整阅读内容仍存在；交互按钮不会假装向外发送资料。
- full-bleed Hero coverage at desktop: target 100%，minimum 96%。
- mobile still has a deliberate large media field: yes，100svh Hero、68svh 里弄媒体与 86svh 结尾视频。
- typography override preserves media box and subject position: yes，V6 仅能在既定 copy-safe zone 内调整 max-width/断行。
- measured horizontal overflow: 1440 / 768 / 390 均为 0px。
