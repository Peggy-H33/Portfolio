# Typography lab

## Subject voice

克制奢华、电影题名、海派编辑、私宅温度、当代而不仿古。映射为：高对比装饰宋体承担主命题；一款松弛书写体承担人物/时刻题词；阅读宋体承担长文和界面。

## Real specimen copy

- Hero: 把上海，住成一场电影
- Section headings by pattern: 江岸高处，云与水同时醒来 / 转进里弄，住进一方安静 / 沿苏河，把夜色留在窗外
- Quote / brand mark: 沪上住志 / 今晚，不赶路
- Body: 不是把行程塞满，而是把抵达、洗去风尘、看一场雨与醒来的光，重新排成一条属于你的上海时间线。
- CTA / nav accents: 探索三种住法 / 定制沪上住法 / 住法 / 时刻 / 私享
- Caption / label / badge / data: 06:20 江岸初醒 / 16:40 梧桐影长 / 23:10 苏河夜泊

## Candidate A — 书写峰值

- Hero / section / quote / accent / reading / utility: 马善政体 / 马善政体 / 龙藏体 / 马善政体 / 思源宋体 / 思源宋体
- Source/license/language coverage: 开源，SC；书写气息强。
- Metrics and CSS: Hero 8.8vw/1.02；标题 5.2vw/1.1；题词 3.8vw/1.16。
- Choose/reject: 在酒店主题中笔锋过于节庆与文化活动，主命题显得急；保留龙藏体作为低频题词候选。

## Candidate B — 当代海报

- Hero / section / quote / accent / reading / utility: 得意黑 / 得意黑 / 站酷小薇体 / 得意黑 / 思源宋体 / 思源宋体
- Source/license/language coverage: 开源，SC。
- Metrics and CSS: Hero 9.2vw/0.96；标题 5.5vw/1.0；短标签 15px。
- Choose/reject: 远距轮廓强，但上扬窄字更接近年轻潮流/消费科技，削弱静谧私宅感，拒绝为主系统。

## Candidate C — 海派编辑（选中）

- Hero / section / quote / accent / reading / utility: 猫啃网风雅宋 / 猫啃网风雅宋 / 龙藏体 / 龙藏体短题词 / 霞鹜新致宋 / 霞鹜新致宋
- Source/license/language coverage: 风雅宋与龙藏体为 SIL OFL 1.1，霞鹜新致宋为 IPA Font License 1.0，均覆盖 SC；正式包只提交这三款字体与许可证。
- Metrics and CSS: Hero clamp(4.2rem,9vw,9.4rem)/0.98；章节 clamp(3rem,6.2vw,7.2rem)/1.04；题词 clamp(2rem,4vw,4.6rem)/1.15；正文 17–19px/1.78。
- Choose/reject: 风雅宋的高对比与装饰骨架像当代酒店杂志题名；龙藏体只在“今晚，不赶路”等短句出现，形成作者性回声而不仿古。

## Selected system

- First visual language: Chinese
- Signature module and phrase: editorial_quote / “不只睡一晚，借一座城的节奏。” / 龙藏体
- Supporting display: hero_display + section_heading / 猫啃网风雅宋
- Chinese V6 handoff used: yes
- Local geometry state: locked-after-real-glyph-test
- Distribution mode: distributed
- Expressive surface IDs: manifesto-quote、timeline-afternoon-title、stay-two-quote、stay-three-caption、selector-detail-title、footer-brand
- Non-Hero expressive surface IDs: 同上，共 6 个，分布于 manifesto / lane / ritual / choose / footer
- Non-large-title expressive surface IDs: 全部 6 个；没有把表现字体局限在 Hero 或大标题
- Reading-protected surface IDs: hero-intro、manifesto-body、时间线正文、三段住法正文、选择器正文与事实、final-body、dialog-fields、footer-legal
- Art-direction locks preserved: layout / media / sections / color / motion
- CSS tokens: --type-display 风雅宋；--type-script 龙藏体；--type-reading/--type-ui 霞鹜新致宋。
- Fallback/loading strategy: local files + font-display swap；SC serif/cursive/system fallback；不声明不存在字重；主展示字体 preload。
- Full-page coverage: 默认状态 65 个可见文字表面全部带唯一 `data-type-surface`，由 9 个语义模块完整接管；提交后确认状态沿用 form_control。
- Desktop/phone fitting results: Hero 0.654 / 0.705；宣言 0.990 / 0.983；里弄标题 0.888 / 0.867，均未超过容器。
- Unintended line failures: 0 个单汉字孤行；0 个标点孤行；移动端结尾从早期三行修正为两条完整短句。
- Small expressive surface checks: 时间题词、选择器题词与页脚品牌均完成 phone / 200% / bright-dark / fallback 实拍。
- Rendered evidence: `qa/font-lab-desktop.png`、`qa/font-lab-phone.png`、`qa/fullpage-desktop.png`、`qa/fullpage-phone.png`、`qa/zoom-200.png`、`qa/font-fallback-desktop.png`。
- Previous-project repetition check: 本项目未读取或复用其他交付站点的字体选择记录；选择来自本主题候选实排。
