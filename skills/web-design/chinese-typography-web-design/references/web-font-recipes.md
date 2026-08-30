# 中文网页字体下载与接入

V6 只下载已经在 `typography-module-plan.json` 中提交的字体，不提供风格预设、候选池或固定搭配。先按 `style-to-font-selection.md` 为每个文字表面完成真实渲染，再把所有模块的 `font_id` 去重；字体接入只能做通过最终截图证明必要的局部文案几何调整，不得修改宿主页面的媒体或宏观结构。

## 只下载提交字体

```bash
python scripts/download_open_fonts.py ./my-site \
  --fonts smiley-sans,source-han-sans-sc
```

脚本写入：

- `fonts/`：实际字体文件；
- `fonts/local-fonts.css`：本地 `@font-face`；
- `fonts/licenses/`：可取得的许可证；
- `font-download-report.json`：来源、结果、失败和跳过项。

`requested_font_ids` 必须等于模块计划中 `committed_font_ids` 的唯一集合。脚本必须拒绝空列表、未知 ID 和不可自动再分发字体。不要为了以后可能使用而提前下载。

## 以模块 token 接入

```html
<link rel="preload" href="./fonts/hero-display.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="./fonts/local-fonts.css">
```

```css
:root {
  --type-brand: "Committed Brand Face", sans-serif;
  --type-hero: "Committed Hero Face", sans-serif;
  --type-section: "Committed Section Face", sans-serif;
  --type-body: "Committed Body Face", system-ui, sans-serif;
  --type-ui: "Committed UI Face", system-ui, sans-serif;
  --type-data: "Committed Data Face", ui-monospace, monospace;
}

[data-type-module="brand_mark"] { font-family: var(--type-brand); }
[data-type-module="hero_display"] { font-family: var(--type-hero); }
[data-type-module="section_heading"] { font-family: var(--type-section); }
[data-type-module="body_longform"] { font-family: var(--type-body); }
[data-type-module="nav_ui"],
[data-type-module="cta"],
[data-type-module="form_control"] { font-family: var(--type-ui); }
[data-type-module="data_price"],
[data-type-module="code_terminal"] { font-family: var(--type-data); }
```

只定义页面存在的 token。多个 token 可以指向同一个字体，但每次指向都要有模块级理由；不要先定义一个三字体栈再让所有模块继承。

## 字重与变量轴

- `@font-face` 只声明文件真实提供的字重和样式；设置 `font-synthesis: none`。
- 可变字体声明准确范围，例如 `font-weight: 300 900`；宽度轴通过 `font-variation-settings` 或受支持的高级属性控制。
- Hero 的轴变化必须服务断点或状态，不把字体轴做成持续抖动的装饰。
- 正文预加载一个关键字重；非首屏展示字体可延后加载。

## 验证实际加载

```js
await document.fonts.ready;
const ok = document.fonts.check(
  "400 48px 'Committed Hero Face'",
  "让视野，先于世界一步 AI 2026"
);
if (!ok) document.documentElement.dataset.fontFailure = "hero_display";
```

在截图记录 computed `font-family`、文件请求状态和 `document.fonts.check()`。候选未加载时显示的 fallback 不能进入 A/B/C 评分。

## Fallback 与加载失败

- fallback 首先匹配 locale 和字形类型，再考虑视觉接近；SC、TC、HK 不互相冒充。
- fallback 也要检查断行，避免 FOIT/FOUT 后标题从两行跳成三行。
- 首屏可用 `font-display: swap`；品牌字轮廓变化极大时可使用短暂 `block`，但不能永久隐藏内容。
- 缺字时不要静默落到日文字体；记录缺字并更换字体或受控拆分 span。

## 许可证红线

- 自动下载仅处理 `open_source*`；保留许可证与官方来源。
- `brand_free`、`proprietary_free`、`brand_reference` 只作风格参考，除非用户提供官方文件且目标用途已核验。
- 免费商用不等于允许网页嵌入、转换、子集化、CDN 或向客户交付。
- 不从官网 CSS、App、缓存或第三方字体站提取文件，不把受限字体提交到 Git、npm、CDN 或 skill。
- 内部测试遵守 `official-test-fonts.md`，正式发布前移除受限文件并重新核验。
