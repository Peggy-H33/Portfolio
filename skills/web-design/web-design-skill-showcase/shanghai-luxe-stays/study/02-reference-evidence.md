# Reference evidence

本项目没有外部品牌参考页。证据来自用户指定的两份 skill 合同、上海在地空间语汇和后续生成素材的逐帧检查；不复制任何现有酒店品牌识别。

| Evidence ID | Source | Dimension | Observation | Inference | Context/viewport | Confidence | Reusable rule | Alternative | Selection condition | Test |
|---|---|---|---|---|---|---|---|---|---|---|
| E01 | 用户主题 | 内容 | “上海”“高端”“酒店民宿”同时出现 | 页面必须兼具城市辨识、服务克制和私宅尺度 | 全页 | high | 每段媒体至少携带两项上海/旅居信号 | 抽象奢华静物 | unrelated-brand test |
| E02 | v10 Hero contract | 媒体面积 | cinematic-full-bleed 桌面需覆盖至少 90% Hero | Hero 不应成为右上角视频窗 | 1440×900 | high | 视频 absolute inset 0，文案落在测量安全区 | contained contrast | DOM/CSS + 截图 |
| E03 | 上海空间语汇 | 材质 | 江岸玻璃、石库门灰砖、Art Deco 黄铜可共同指向上海 | 材质比泛金色渐变更具体 | 章节媒体 | medium | 每条视频用一种主材质和一种城市光线 | 纯黑金卡片 | 首中末帧检查 |
| E04 | 中文 V6 | 字体 | 全页需一个峰值与至少两个非 Hero 表现表面 | Hero 主句不能只是默认黑体 | 全页 | high | Hero 用装饰宋体，题词用书写体，正文保持阅读保护 | 单字体全页 | 字体截图与 DOM 对账 |
| E05 | v10 color gate | 色彩 | 高饱和平面应控制在 5–20% | 暖金只用在线条、按钮与灯光 | full-page | high | 78% 墨/骨/灰，10% 暖金/青绿 | 连续金色 section | 全页缩略图 |
| E06 | 移动端裁切 | 响应式 | 16:9 上海室内画面在 9:16 cover 下可能丢失窗景 | 手机 Hero 应用经验证的 object-position 与更短文案 | 390×844 | medium | 文案顶部、主体右中；必要时保留海报构图 | 视频下移成半屏 | 手机截图 |

## VLM/image inspection notes

- 生成完成后保存每条视频的 first/middle/last 同比例帧，观察窗帘、雨、蒸汽、反射等内在运动。
- Hero 必须同时看见“高端旅居室内”与“上海江岸夜景”两个具体信号；只有金色客房或只有城市天际线均不通过。
- 文案安全区固定在桌面左 7%–43%，主体目标在右 58%–88%；不以重黑遮罩掩盖生成缺陷。

## Prohibited copying

- Brand/logo/copy to exclude: 任何真实酒店名、Logo、已有宣传口号、平台 UI 与可辨认商标。
