# 从网页模块选择中文字体

不要先决定“整站使用哪三款字体”。先读取并锁定已有页面艺术方向，再为每个文字表面独立判断字形行为。字体系统是局部决定的汇总结果，不是预设套餐；完成选择后建立一个最高签名峰值，并用有节奏的非 Hero 表现文字形成全站呼应。

## 一、把提示词转成网页设计语言

提取以下信号；未知项写 `unknown`：

1. `page_type`：landing、product、SaaS、editorial、commerce、portfolio、dashboard、campaign。
2. `visual_voice`：冷静/热烈、精密/手作、克制/外放、未来/怀旧、奢华/亲民、理性/诗意。
3. `composition`：瑞士网格、编辑非对称、电影化满幅、海报拼贴、仪器界面、柔和卡片、 brutalist、复古像素、东方留白。
4. `surface`：纯色高对比、低饱和纸感、暗色发光、金属/玻璃、自然材质、影像主导。
5. `content_density`：低密度宣言、中密度营销、高密度工具、长篇阅读。
6. `audience`、`media_character` 和 `locale`。

行业词不能直接决定字体。“AI 眼镜”至少可能产生：时装编辑式消费科技、光学实验室式精密科技、生活方式式亲和科技、增强视觉式赛博界面。

## 二、先列模块，不列字体组合

| 模块 ID | 任务 | 选择时看什么 | 常见风险 |
| --- | --- | --- | --- |
| `brand_mark` | 品牌名称或标志性短语 | 轮廓记忆、少字辨识、与 Logo/产品关系 | 把通用黑体当品牌字；伪造签名字样 |
| `hero_display` | 首屏主命题 | 远距离轮廓、断行、主体安全区、情绪峰值 | 所有标题居中；细字压在复杂视频上 |
| `section_heading` | 章节导航与节奏 | 重复使用稳定性、层级切换、页面网格 | 每章都像第二个 Hero |
| `editorial_quote` | 引语、题词、作者声音 | 手写/书法个性、留白、短句节奏 | 花体承担长段落 |
| `body_longform` | 正文和叙事 | 字面、行长、行高、标点、长时间阅读 | 为个性牺牲可读性 |
| `nav_ui` | 导航、标签、状态 | 小字号清晰、跨设备、字重与点击宽度 | 用展示字造成扫描困难 |
| `cta` | 主要动作 | 动词识别、按钮尺寸、对比度、字重 | 把 CTA 做成难辨的书法题字 |
| `data_price` | 数字、价格、指标 | 数字宽度、基线、tabular nums、强调能力 | 中文数字使用不匹配字体导致跳动 |
| `code_terminal` | 代码、命令、快捷键 | 中西文比例、等宽、符号覆盖 | 全站正文等宽化 |
| `caption_metadata` | 图注、日期、编号、法律说明 | 小字号、层级退后、数字和标点 | 过细、低对比、字距过大 |
| `form_control` | 输入、选择、错误提示 | 可读、状态区分、字符覆盖 | 品牌展示字进入表单 |
| `poster_badge` | 活动贴纸、短标签 | 高识别轮廓、少量变化 | 标签泛滥、每个模块一个字体 |

## 三、为单个模块写选择合同

每个模块单独填写：

```yaml
module: hero_display
text: "让视野，先于世界一步"
importance: primary
length: 10
visual_voice: [fashion-editorial, optical, light-experimental]
background: dark-moving-video
alignment: left-offset
safe_width: 7.5em
required_behavior: [distinct-silhouette, two-line-stable, high-contrast]
forbidden_behavior: [dense-body, faux-bold, full-screen-centered]
```

然后在 `chinese-font-library.md` 中筛选符合该模块的独立字体。下一个模块重新判断，不能沿用上一个模块的结论。

## 四、用网页风格描述词筛选

优先使用以下可观察词，而不是“好看、潮、高级”：

- 布局：Swiss grid、editorial asymmetry、split-screen、full-bleed cinematic、poster collage、modular dashboard、brutalist、catalog grid、museum placard。
- 字形：geometric grotesk、humanist sans、display serif、Didone-like contrast、Fangsong editorial、rounded UI、condensed display、marker lettering、running script、pixel grid、monospaced utility。
- 节奏：低密度宣言、紧凑扫描、长篇阅读、短促行动、章节题词、数据脉冲、海报冲击。
- 表面：高对比黑白、低饱和纸感、暗色光学、柔和消费科技、复古印刷、粗粝街头、清透玻璃、自然有机。
- 动作：克制静态、滚动揭示、字幕式切换、速度斜向、手稿批注、终端反馈。

把这些词与每款字体的“风格主题”和“模块行为”对照。字体名称或所属品牌不构成选择理由。

## 五、运行独立候选脚本

```bash
python scripts/recommend_module_fonts.py \
  --prompt "低饱和电影感的中文摇滚乐队长页，标题有手写和唱片封套气质" \
  --locale zh-CN \
  --page-type editorial \
  --expressive-mode required \
  --modules brand_mark,hero_display,section_heading,editorial_quote,body_longform,nav_ui
```

输出按模块分组。每组候选互不绑定，也不会自动决定最终字体或下载资源。若某模块输出近似候选过多，应从 `chinese-font-library.md` 人工补入字形明显不同的第三个候选。

## 六、真实渲染门槛

候选进入比较前必须同时满足：

1. locale 和常用字覆盖正确；
2. 文件来自许可允许的来源；
3. CSS 实际加载完成；
4. `document.fonts.check("400 48px 'Family Name'", "真实中文标题 2026")` 返回真；
5. 截图中记录 computed `font-family` 和加载状态；
6. 同一模块的候选使用相同内容、容器、背景和断点。

未下载的字体、系统 fallback 或浏览器本地偶然存在的字体不得参与最终评分。

## 七、决定而不绑定，再做全局收敛

逐模块记录选择与拒绝理由，再做资产去重：

- 可以让一个可靠字体同时承担正文、导航和表单，但理由分别写清；
- 可以让 Hero 使用展示字体而章节标题回到中性字体；
- 可以让品牌名使用花体、Hero 使用几何字体；二者不必同类；
- 可以整站只用一个可变字体，但必须通过字重、宽度、字号、行距和布局建立模块差异；
- 不规定“花体必须配黑体”“宋体必须配某款无衬线”等套餐。

最终页面一般控制在 1–3 个中文家族以保护性能，但这是提交后的资产约束，不是选择前的固定组合。

逐模块选择结束后声明 `signature_module`、`signature_font_id` 和 `signature_coverage`。营销、编辑、音乐、文化、作品集和 campaign 页面默认需要一个非中性的中文签名时刻；政务、医疗、无障碍或用户明确要求中性时例外。签名必须覆盖真实主句或其中的视觉核心短语，不能只藏在小字号 `<em>` 中。

检查 Hero、章节、引语之间的峰值分布：不让同一个“安全展示字”以相同大小和姿态遍布所有大标题，也不让巨大 Latin 品牌名无意中压低中文主句。

## 八、验收选择质量

逐模块提问：

- 不看字体名称，仅看轮廓，它是否表达了模块任务？
- 和视频、图片、色块及留白的关系是否成立？
- 同一字体换到别的行业模板是否仍完全一样？若是，主题辨识度不足。
- 390px 下是否出现孤字、过密或遮挡主体？
- 颜色、字距、行高和字重是否与字形协作，而非依赖字体独自“变好看”？
- 用户明确要求花体/手写时，是否比较了至少两个不同书写型家族，并最终提交 `calligraphic` 或 `handwritten` 签名字体？用户只要求不板正或视觉冲击时，是否比较了至少两个不同表现型类别？若没有，是否有可复核的可读性、字形、授权或主题冲突证据以及用户认可？
- 字体覆盖前后，Hero 媒体模式、尺寸、焦点和页面结构是否完全保持？

选择记录必须附真实截图；文字理由不能替代视觉证据。
