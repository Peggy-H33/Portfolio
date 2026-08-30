# 全站文字覆盖合同

字体设计的完成条件不是“Hero 换过字体”，而是页面中每一种可见文字表面都获得明确的字体角色和参数。完整网页必须使用 `scope: full-page`；只有用户明确限定单一组件时才可使用 `scope: component`。

## 1. 先盘点文字表面

给承载可见文字的最近稳定容器添加 `data-type-surface="<surface-id>"`。该属性只用于审计，不得借此改 DOM 顺序、网格、媒体或组件结构。相同用途的重复元素可共享一个 ID，例如三条作品年份都可使用 `release-year`。

至少检查以下角色是否存在：

- 品牌名、导航、跳转链接与页眉元数据；
- Hero 主句、导语、行动按钮和序号；
- 章节眉题、章节标题、正文、引语和强调短语；
- 数字、年份、价格、参数、英文标题和中英混排；
- 媒体按钮、图注、状态、表单和辅助控件；
- 页脚、来源、法律说明与动态控制。

不能用一个过宽的 `body` 标记掩盖角色差异。若两个文字组的字号、字重、字距、颜色、行高或阅读任务不同，应拆成不同 surface；它们仍可由同一个模块和同一字体拥有。

## 2. 为每个表面指定完整参数

每个 surface 必须且只能被 `modules[].surface_ids` 中的一条模块记录拥有。模块记录同时写明字体、真实字重、字号、行高、字距、颜色、最大行宽、对齐、fallback、混排目的和选择理由。

“全站设计”允许表现字体分布到不同层级：

- `signature`：全页最强的花体、手写体或表现型峰值；
- `support-display`：章节标题、引语、品牌回声或大型数字，形成次级节奏；
- `reading`：导语和正文，控制行宽、行距、字色与标点连续性；
- `utility`：导航、CTA、图注、表单、页脚和控制文字；可采用表现字体，但最终尺寸必须有可读性证据。

主签名字体负责最高峰值，不设机械次数上限。按 [expressive-distribution.md](expressive-distribution.md) 为至少两个非 Hero surface 安排表现型候选，并保护长文与关键交互。其余表面即使沿用同一阅读字体，也必须分别设计字重、字号、字距、颜色和混排规则。

## 3. 记录覆盖表并自动对账

在 `coverage_audit` 中列出 DOM 的全部 surface ID：

```json
{
  "scope": "full-page",
  "dom_marker_attribute": "data-type-surface",
  "visible_text_surface_ids": ["brand-mark", "hero-primary", "body-reading"],
  "covered_text_surface_ids": ["brand-mark", "hero-primary", "body-reading"],
  "uncovered_text_surface_ids": [],
  "coverage_reason": "品牌、首屏主句和正文分别承担识别、签名峰值与连续阅读。"
}
```

运行：

```bash
python scripts/validate_typography_plan.py \
  study/typography-module-plan.json \
  --html index.html
```

校验器会阻止以下情况：

- 页面仍有未标记的可见文字；
- HTML 标记与计划清单不一致；
- 某个 surface 没有模块负责或被多个模块重复负责；
- `uncovered_text_surface_ids` 非空；
- 完整网页省略 `--html`，只提交 Hero 计划；
- 高影响模块缺少真实 A/B 候选证据。

## 4. 验收层级而非字体数量

截图中逐项确认：

- 品牌、导航、正文、标题、引语、数字、CTA、图注、控件和页脚都有可解释的层级；
- 中文和 Latin/数字基线、字重与间距协调；
- 亮暗视频帧上文字颜色和字重仍清晰；
- 花体和表现字体在全页形成可解释节奏；小字号使用必须通过实拍、200% zoom、手机和 fallback 检查；
- 200% 缩放、手机断行和字体失败 fallback 不破坏阅读；
- 媒体尺寸、裁切、焦点、色板、网格和动效与接入前一致。
