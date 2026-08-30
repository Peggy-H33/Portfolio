# 中文签名字体意图分类

“有个性”“不板正”和“花体”不是同一个验收目标。先保存用户原词，再选择以下一种 `signature_intent`；不得用主题联想覆盖明确措辞。

| 意图 | 典型原词 | 可作为最终签名的类别 | 不能单独满足 |
| --- | --- | --- | --- |
| `script-floral` | 花体、手写、行草、草书、行书、书法、毛笔、题字、签名感、书写感、作者性 | `calligraphic`、`handwritten` | 得意黑、龙珠体、无界黑、圆体、像素字、装饰宋体；它们可以是对照，但没有真实书写轨迹 |
| `expressive-display` | 不板正、不正经、海报感、实验、赛博、时装、视觉冲击、先锋 | `calligraphic`、`handwritten`、`rounded-playful`、`impact-display`、`pixel-mono` | 中性 UI 字体；除非有具体可读性或许可证据，否则不能退回板正黑体 |
| `restrained` | 只用中性、政务、医疗、无障碍优先、严肃企业系统 | `neutral-ui`、必要时 `serif-editorial` | 不能为了“惊艳”让关键操作和长文变成装饰字 |

## 决策优先级

1. 用户明确否定花体/手写时选择 `restrained`，不要按关键词误判。
2. 用户明确说“花体、手写、行草、书法”等词时选择 `script-floral`。页面同时出现“工业、科技、摇滚、冷峻”也不能把它自动降级为实验黑体。
3. 用户只说“不板正、海报感、视觉冲击”时选择 `expressive-display`，由实际字形和页面主题决定是哪一类。
4. 未明确说明时，营销、音乐、文化、编辑和 campaign 页面可默认 `expressive-display`；不得默认声称用户要求了书法花体。

## `script-floral` 的候选与提交门槛

- 在同一真实模块中加载至少两款不同的书写型字体，例如龙藏体与志莽行书；另加一款非书写型表现字作为对照。
- 最终 `signature_style_category` 必须是 `calligraphic` 或 `handwritten`，并覆盖完整主句或主要视觉核心。小号 `<em>` 不算完成。
- 不能仅因“工业、现代、科技、冷峻”否决书写体。书写与几何媒体的软硬反差可能正是设计意图；拒绝需要指出具体 glyph、断行、安全区、对比、locale 或授权问题。
- 候选断行失败时，先为该字体独立调整字号、字距、行高和允许断行，再判断字体。把另一字体的 176px 参数原样套给行草，造成第三行后再否决，不是有效 A/B。
- 草书可读性不足时保留可读的 `aria-label` 或邻近等价文本；正文、导航、CTA、价格和法律文字继续使用清楚字体。

## 输出字段

`global_hierarchy` 必须记录：

```json
{
  "signature_intent": "script-floral",
  "script_signature_required": true,
  "signature_style_category": "calligraphic"
}
```

验证器会拒绝用 `rounded-playful`、`impact-display` 或 `pixel-mono` 冒充明确的花体/手写要求。
