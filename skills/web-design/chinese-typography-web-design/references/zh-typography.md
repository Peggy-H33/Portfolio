# 中文网页字体与混排规范

## 1. 先确认区域

| locale | 默认字形 | 适用 |
| --- | --- | --- |
| `zh-CN` | 简体中文 SC | 中国大陆产品、SaaS、技术站 |
| `zh-TW` | 繁体中文 TC | 台湾用户和繁体内容 |
| `zh-HK` | 繁体中文 HK | 香港语境；不要假设 TC 完全相同 |
| `ja-JP` | 日文 | 仅当页面确实面向日语用户 |

HTML 的 `lang`、字体文件的 region 和实际内容必须一致。`Noto Sans CJK JP` 不是简体中文字体；若同页有多语言，给每个语言块设置 `lang`，而不是给全站只配一个字体。

## 2. 角色化字体，而不是随机挑字体

```yaml
roles:
  display_zh: {family: "Source Han Serif SC", weight: 700, use: "主标题/章节"}
  body_zh: {family: "Source Han Sans SC", weight: 400, use: "正文/说明"}
  ui_zh: {family: "Source Han Sans SC", weight: 500, use: "按钮/导航/表单"}
  latin_data: {family: "IBM Plex Mono", weight: 500, use: "编号/单位/代码"}
```

每个角色都要有 1 个首选、1 个同区域 fallback、1 个系统 fallback。显示字体与正文最多两套家族；额外字体只用于明显的功能角色。

## 3. 真实内容试排

至少用以下样本，而不是 Lorem Ipsum：

```text
从工作负载开始，而不是从参数开始。
模型行为与数据移动 / 01
AI 训练吞吐提升 2.4×，GPU 负载 82%，2026.08
“中文标点、英文 API、1,024 个 token 与 100%”
```

检查：汉字重心、标点悬挂、括号与数字宽度、英文大写、长标题断行、粗体是否糊成一团，以及不同浏览器的 fallback 跳变。需要手动断行时使用语义化 `<br>` 或可控的 `span`，不要把每个汉字拆成动画节点。

## 4. 起始尺度（再用截图校准）

- 正文至少 16px；长文阅读优先 17–18px。
- 正文行长约 20–32 个汉字，或用 `max-width: 65ch` 起步；不要让正文横跨整个桌面屏。
- 正文行高 1.55–1.85；中文标题通常 1.08–1.28，需观察字面高度。
- 通过 `clamp()` 建立桌面/移动连续尺度；移动端先减小容器宽度和字距，再减小字号。
- 中文大标题不要强制负字距；只有在真实截图确认字面不会粘连时才使用微小 tracking。

```css
:root {
  --font-display-zh: "Source Han Serif SC", "Noto Serif CJK SC", serif;
  --font-body-zh: "Source Han Sans SC", "Noto Sans CJK SC", system-ui, sans-serif;
  --font-data: "IBM Plex Mono", "SFMono-Regular", monospace;
}
.headline {
  font-family: var(--font-display-zh);
  font-size: clamp(2.6rem, 7vw, 7.5rem);
  line-height: 1.12;
  max-inline-size: 9em;
  text-wrap: balance;
}
.reading { max-inline-size: 65ch; line-height: 1.7; }
```

## 5. 字体加载与授权

使用 WOFF2、必要时子集化；为关键字体保留许可证和来源；`font-display: swap` 不能替代 fallback 试排。若自托管：

```css
@font-face {
  font-family: "Site Sans SC";
  src: url("/fonts/site-sans-sc.woff2") format("woff2");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
  unicode-range: U+3000-303F, U+3400-4DBF, U+4E00-9FFF;
}
```

仅对真正包含对应 glyph 的文件声明 `unicode-range`。中文字体体积通常显著大于西文字体；先测首屏加载，再决定子集化，不能为了速度丢失正文 glyph。200% 缩放和离线/禁用 Webfont 都要保持可读。

## 6. 复核清单

- [ ] `lang` 与字形区域匹配。
- [ ] 汉字、标点、英文、数字、emoji 真实试排。
- [ ] 标题/正文/UI/数据角色可解释，权重实际存在。
- [ ] 大标题没有孤立单字、异常断行或遮住媒体焦点。
- [ ] 正文宽度、行高、对比度和 200% 缩放可读。
- [ ] 首选字体失败时 fallback 不会切换成日文或符号字体。
- [ ] 字体许可证、来源、子集化流程写入交付物。
