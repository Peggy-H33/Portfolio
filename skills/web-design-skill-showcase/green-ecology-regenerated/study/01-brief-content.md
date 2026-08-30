# 01 Brief and content architecture

## Locked brief

- Subject: 绿色生态环保；以一滴雨水穿过山林、湿地、河网和城市回用系统为叙事线索。
- Audience: 对气候与城市生态有兴趣的公众、社区行动者、可持续团队。
- Page job: 让访客理解“修复不是口号，而是一条可进入的循环”，并选择一种低门槛行动。
- Primary action: 查看三种可参与的生态行动。
- Secondary action: 开启/暂停场景声音（页面默认静音，本版只提供影像控制）。
- Content confidence: 页面采用原创概念叙事；不声称具体项目成绩，不使用未经来源支持的百分比或宏大排名。
- Length: narrative long-form，5 个主要章节与一个收束页脚。
- Technical context: 无框架静态 HTML/CSS/JS；现代 Chromium/Safari/Firefox；zh-CN。
- Regression baseline: none，重新生成且不复用旧页面。

## Dominant visual priority

`cinematic-full-bleed`。Hero 使用至少 100svh 的全屏生成视频，媒体覆盖 Hero 100%，左侧/上方是文字安全区，生态主体集中在右下到中央。页面必须由真实水流、风、植被、雾气和反射的时间变化驱动，而不是静态图平移。

## Subject-specific signals

1. 清晨湿地的芦苇、浅水、鸟群、雾气与真实风向变化。
2. 山地溪流穿过苔藓岩石，水体、叶片与光斑同时发生变化。
3. 城市雨水花园、透水铺装和行人尺度的循环水景，而非泛科技绿光。

## Prohibited claims and patterns

- 不使用无来源的碳减排、净化率、覆盖面积等量化成绩。
- 不用通用绿色卡片墙、叶子图标堆叠、霓虹科技走廊或与主题无关的抽象粒子。
- 不把“绿色”理解成连续大面积纯绿背景；高饱和绿色只作短暂信号。

## Narrative candidates

1. Thesis → evidence → mechanism → outcome → action：从“让水重新有路可走”到三种可参与行动。清晰，但略像倡议机构官网。
2. Context → tension → reveal → exploration → action：从“城市把水留在表面”转入自然循环的重新显影。戏剧张力强，但容易制造没有证据的危机叙事。
3. Artifact-led：一滴雨作为主角 → 湿地呼吸 → 河流回声 → 城市共生 → 个人选择。可由三段视频自然串联，最适合电影化长页。

## Selected narrative

选择 3，章节顺序锁定：

1. `hero-rain-thread`：一滴雨不是终点，是一条回家的路。
2. `wetland-breath`：让湿地重新呼吸；说明缓慢、停留、渗透的价值。
3. `river-memory`：河流记得方向；呈现流动、连接与恢复。
4. `city-symbiosis`：把城市还给四季；展示雨水花园与共生空间。
5. `action-choose`：今天，留下一小块会呼吸的地方；三项真实可执行动作。
6. `footer-return`：回到水的循环，提供重播与回顶。

## Evidence source per section

- Hero / 湿地 / 河流 / 城市：为本页专门生成的模型视频及其 provenance sidecar；可见内容只描述影像中确实存在的生态过程。
- 行动章节：通用且可验证的个人行动——减少硬质铺面、保留乡土植物、让雨水就地渗透；不声称固定效果数值。
- Footer：页面内导航与媒体控制，不依赖外部数据。

## Gate result

PASS。页面任务、内容边界、用户行动与 Hero 媒体模式均已明确；每个章节有独立内容职责。
