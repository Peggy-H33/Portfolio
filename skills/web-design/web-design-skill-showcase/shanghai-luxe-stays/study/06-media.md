# Media lab

- Density: standard（3 段独立生成视频，3 个叙事角色）
- Compact exception reason: none

## Narrative map A

Hero 江岸套房 → 里弄雨院 → 雨夜夜床。由城市大景逐步收至私密结果。

## Narrative map B

Hero 江岸套房 → 浦江晨雾 → 苏河夜泊。城市景连续但酒店/民宿内部不足。

## Narrative map C

Hero 里弄私宅 → 黄铜细节 → 江岸结尾。故事性强但首屏不够直接表达“高端酒店”。

选择 A 的修订版：Hero 建立城市与酒店，里弄建立民宿街区，结尾夜床回到私享结果。茶仪式保留为独立生成静帧，不冒充动态视频。

## Selected media system

| Asset | Role | Section | Source kind/model/task | Intrinsic motion | Ratio/duration | Focal points | Safe zone | Loading/playback | Delivery status |
|---|---|---|---|---|---|---|---|---|---|
| hero-atmosphere.mp4 | hero-atmosphere | hero | text-to-video / Seedance / `1edd9670…` | 窗帘、雨滴、船灯、反射、推进 | 16:9 / 8.04s | 72%,54% | left 0-42% | muted loop；poster 常驻；全局与局部控制 | final eligible |
| lane-house.mp4 | context-environment | lane | text-to-video / Seedance / `25684ca2…` | 细雨、树叶、涟漪、门扇、暖光、横移 | 16:9 / 8.04s | 38%,56% | subject left/center | viewport-near load；局部控制 | final eligible |
| closing-night.mp4 | outcome | final | text-to-video / Seedance / `6413db85…` | 雨滴、船灯、帘布、床品、灯光、后退 | 16:9 / 8.04s | 50%,48% | center 28-72% 经深色 scrim | viewport-near load；局部控制 | final eligible |

## Authentic-motion evidence

- Still-derived pan/zoom/luminance MP4s present: no
- First/middle/last equal-crop frames saved: yes，`study/frames/{hero,lane,closing}-{first,middle,last}.jpg`
- Normal-speed playback reviewed: yes，三段均为 8 秒、24fps、H.264、1280×720
- Every final asset has motion beyond camera movement: yes
- Sidecar and media plan provenance agree: yes，v10 输出校验通过
- Missing video capability/blockers: none
- Non-final attempt note: 原茶仪式创建请求以 SSL EOF 结束且没有 task ID；按计费安全约束未重试同一任务。其 ImageGen 静帧仅作为章节静态媒体，不进入 v10 最终视频清单。

## Obstruction and crop results

- Hero first/middle/last frame: 上海天际线与落地窗始终在右中部，左侧题名区保持暗且稳定
- Hero focal target met: yes
- If no, regeneration attempts and selected replacement: not applicable
- Full-bleed coverage preserved after integration: yes，1440 / 768 / 390 均为 1.000
- Typography merge changed media geometry: no
- Closing obstruction review: 中央标题叠在暗床品与雨窗上，双层 scrim 保持对比，灯具和床品仍在外侧可辨认
