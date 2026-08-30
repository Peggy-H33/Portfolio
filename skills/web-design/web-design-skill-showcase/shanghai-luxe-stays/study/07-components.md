# Components and copy

| Module | User question/job | Content source | Semantic/interaction contract | Layout cell | Media intersection | Mobile behavior | Removal condition |
|---|---|---|---|---|---|---|---|
| 顶部导航 | 我在哪里、能去哪 | 原创 IA | header + anchors；当前状态不强制 | Hero 顶部全宽 | 避开右侧主体核心 | 折叠菜单按钮 + drawer | JS 失效时桌面主锚点仍存在 |
| Hero 命题 | 这是什么体验 | 原创文案 | h1 + 锚点 CTA + 对话框 CTA | 左 4/12 列 | 只落左侧 safe zone | 100svh，标题三行 | 不移除 |
| 城市时刻轨 | 住法有何不同 | 原创编辑 | ol/timeline | 12 列 | 无媒体遮挡 | 纵向时间轨 | 若时间文案失去作用则合并正文 |
| 三个住法章节 | 各自适合谁 | 原创虚构场景 | section + video/still + CTA | 交替 5/7 列 | copy 与 focal 分区 | 媒体先、文字后 | 不能删除，页面核心 |
| 住法选择器 | 我更适合哪种 | 原创规则 | 3 个 button 切换详情 | 正常流 rail | 无浮层 | 纵向堆叠，详情就地更新 | JS 失效保留默认住法详情 |
| 咨询对话框 | 下一步如何开始 | 演示表单 | dialog + form + 状态确认 | modal | 不覆盖背景视频操作 | full-screen sheet | JS 失效不提交任何资料 |
| 雨夜夜床结尾 | 住完以后留下什么 | 原创视频与文案 | outcome video + CTA + 独立播放按钮 | full-bleed | 中央双层 scrim 保护标题 | 86svh，标题两行 | 保留 poster 与 CTA |

## Proof module decision

- Include? no
- Evidence: 无真实奖项、评分、房价或库存来源，故不创建“信任徽章/数据卡”。
- Obstruction test: Hero 仅保留导航、标题、导语、双 CTA 与播放按钮，全部位于左/下安全区。
- Mobile relocation/removal: 不适用。
