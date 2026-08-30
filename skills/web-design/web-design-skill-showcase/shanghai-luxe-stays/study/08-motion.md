# Motion

- Signature motion: 章节文字以 26px 的纵向距离缓慢归位，方向统一，像窗帘落稳后的呼吸。
- Supporting motion: 导航细线、CTA 箭头、住法切换器的 180–320ms 状态过渡；视频提供主要环境运动。

| Element/state | Purpose | Trigger | Duration/easing | End state | Reduced motion |
|---|---|---|---|---|---|
| Hero copy | 建立阅读次序 | 首屏载入 | 900ms / cubic-bezier(.16,1,.3,1) | 完全可见 | 直接显示 |
| 章节标题 | 呈现章节切换 | IntersectionObserver | 760ms / emphasis | clip 完全打开 | 直接显示 |
| CTA 箭头 | 反馈 hover/focus | pointer/keyboard | 180ms / standard | x +4px | 无位移，仅颜色 |
| 视频播放 | 氛围与状态 | autoplay 或用户按钮 | 原生 | playing/paused | 默认 poster；按钮可显式播放 |
| 住法详情 | 保持选择上下文 | click | 280ms / standard | 新内容可见 | 无位移淡入 |
| 全局动效 | 让用户随时降低运动 | header / mobile menu button | immediate state change | data-motion full/reduced | reduced 时全部视频暂停、reveal 直接显示；每段仍可显式播放 |

- Reduced-motion default captured: `qa/reduced-motion-default.png`
- Explicit play override captured: `qa/reduced-motion-explicit-play.png`
- Global toggle regression: `data-motion=reduced`、`aria-pressed=true`、allVideosPaused=true
- CSS visibility follows application/playback state rather than permanently hiding video: yes（通过 data-playing 控制 opacity；video 始终可被显式播放）
