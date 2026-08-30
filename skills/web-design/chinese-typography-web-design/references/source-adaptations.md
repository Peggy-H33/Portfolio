# 开源来源与蒸馏边界

本 Skill 只吸收公开仓库中的方法、检查项和抽象原则，不复制第三方仓库的原文、品牌资产、代码大段或示例页面。实际使用时仍要检查字体文件和素材的许可证。

## 已采用的来源

| 来源 | 采用到本 Skill 的内容 | 授权/边界 |
| --- | --- | --- |
| [skills-zh](https://github.com/MarcelLeon/skills-zh) 的 [frontend-design](https://github.com/MarcelLeon/skills-zh/tree/main/skills/frontend-design) | 中文场景、中文信息密度、字体角色、真实截图、语义 HTML、两轮设计与反模板复盘 | 仓库示例 Skill 以 Apache-2.0 为主；本包重新组织规则，不复制其文件 |
| [skills-zh theme-factory](https://github.com/MarcelLeon/skills-zh/tree/main/skills/theme-factory) | 先定义主题 token，再让颜色、字体、边框、表面和图表遵循同一主题 | 主题名称与参数重新编写；不把主题选择当成固定模板 |
| [skills-zh canvas-design](https://github.com/MarcelLeon/skills-zh/tree/main/skills/canvas-design) | 空间、形体、色彩、构图的实验式批评，以及“少而准”的文字原则 | 它面向平面图像，本 Skill 仅迁移视觉分析方法 |
| [web-typography](https://github.com/wondelai/skills/tree/main/web-typography) | 真实内容试排、可读长度、行高、字号层级、字体加载与 200% 缩放 | MIT；CJK 数值需要结合实际字形和屏幕验证，不能机械照抄西文阈值 |
| [top-design](https://github.com/wondelai/skills/tree/main/top-design) | 排版即结构、非对称构图、动效目的、0–10 视觉复盘表 | MIT；只借鉴方法，不复制具体作品 |
| [huashu-design](https://github.com/alchaincyf/huashu-design) | HTML 原生交付、动画/媒体/图表分层、变体探索和五维审查 | MIT；保留“可审查的交付物”思想，不依赖其运行时 |
| [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) | 中文标题降级、16 列网格、媒体槽位、结构化检查与多版本审美探索 | AGPL-3.0；本 Skill 不复用其代码或封闭模板，只采用抽象排版经验 |
| [typst-claude-skill](https://github.com/ChanMeng666/typst-claude-skill) | CJK fallback、混排间距、字体打包、可复现构建和交付检查的意识 | MIT；其目标是 Typst/PDF，不作为网页依赖 |
| [MiniMax-AI skills](https://github.com/MiniMax-AI/skills) 的 typography guide | 字体配对、字号/行距/正式文本的分层思路 | MIT；其 GB/T 文档数值不能直接当作网页规范 |
| [Anthropic frontend-design](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design) | 先判断主题/受众/页面任务，hero 表达论文，探索→计划→实现→复盘 | 官方插件内容按其仓库许可证使用；本包只记录抽象工作流 |

## 字体来源

- [思源黑体 / Source Han Sans](https://github.com/adobe-fonts/source-han-sans)：简体中文正文、UI、技术页面的稳健起点。
- [思源宋体 / Source Han Serif](https://github.com/adobe-fonts/source-han-serif)：编辑、文化、长文和高对比标题。
- [Noto CJK](https://github.com/notofonts/noto-cjk)：跨地区 fallback 和系统缺字兜底；明确区分 SC、TC、HK、JP、KR。
- [霞鹜文楷 / LXGW WenKai](https://github.com/lxgw/LxgwWenKai)：人文、教育、生活方式标题或短文；每次发布前用真实字形复核。
- [霞鹜文楷 TC](https://github.com/lxgw/LxgwWenKaiTC)：繁体中文方案，不能和 SC 无条件互换。
- [IBM Plex Sans / Mono](https://github.com/IBM/plex)：拉丁、数字、代码和数据标签的辅助家族，需与中文主字体共测。
- [得意黑 / Smiley Sans](https://github.com/atelier-anchor/smiley-sans)：窄体、斜向、带手绘美术字细节；官方建议用于标题、海报和视频字幕，不用于长正文。
- [马善政体 / Ma Shan Zheng](https://github.com/google/fonts/tree/main/ofl/mashanzheng)：Google Fonts 官方仓库中的书法展示字体，只作为短题字。
- [站酷快乐体 / ZCOOL KuaiLe](https://github.com/google/fonts/tree/main/ofl/zcoolkuaile)、[站酷小薇体](https://github.com/google/fonts/tree/main/ofl/zcoolxiaowei)、[站酷庆科黄油体](https://github.com/google/fonts/tree/main/ofl/zcoolqingkehuangyou)：圆润、手写和复古展示路线；使用时保留仓库的 `OFL.txt` 并做项目授权复核。
- [芫荽 / Iansui](https://github.com/ButTaiwan/iansui)：繁体中文、台湾字形方向的温润楷体，不替代简体中文字体。
- [LXGW 字体项目](https://github.com/lxgw)：补充文楷 GB/轻便版、臻楷、漫黑、新晰黑、新致宋、小赖、悠哉和 Bright Code；按每个仓库的 OFL 或 IPA Font License 分别处理。
- [Sarasa Gothic](https://github.com/be5invis/Sarasa-Gothic)、[Maple Mono](https://github.com/subframe7536/maple-font)：开发者、代码和数据场景的中西文混排候选。
- [Ark Pixel Font](https://github.com/TakWolf/ark-pixel-font)、[Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font)：像素游戏与复古界面，必须锁定整数像素尺寸和地区变体。
- [朱雀仿宋](https://github.com/TrionesType/zhuque)、[遍黑体](https://github.com/Fitzgerald-Porthmouth-Koenigsegg/Plangothic_Project)：文化出版和生僻字覆盖的专项候选。
- [昭源字体](https://chiron-fonts.github.io/)：香港繁体的黑体/宋体方案。
- [ByteDance Fonts](https://github.com/bytedance/fonts)：抖音美好体的官方开源发布。
- [Huninn / 粉圆](https://github.com/justfont/Huninn)、[辰宇落雁体](https://github.com/Chenyu-otf/chenyuluoyan_thin)：台湾圆体与纤细手写路线；均为 OFL，但默认服务繁体字形。
- [清松手写体](https://github.com/jasonhandwriting/JasonHandwriting)：同一作者的 1–9 套手写性格，分别标注圆润、秀气、呆萌、POP、行楷、Q萌、飘逸、随性和文青；不能把九款同时堆进一个页面。
- [猫啃字体组织](https://github.com/maoken-fonts)：采用什锦黑、硬笔楷书、荆南波波黑、荆南缘默体、龙珠体、无界黑、风雅宋和演示字体五款的官方仓库信息；每个条目独立保留来源和 OFL 风险说明。
- [寒蝉圆体](https://github.com/Warren2060/ChillRound)、[寒蝉高黑体](https://github.com/Warren2060/ChillGSans)：圆体与带手写/旧字形气质的窄黑路线。
- [俐方体 11 号](https://github.com/ACh-K/Cubic-11)：繁体优先的 11×11 像素展示字体。
- [源云明体](https://github.com/ButTaiwan/genwan-font)、[未来荧黑](https://github.com/welai/glow-sans)：旧印刷墨晕的繁体编辑路线与几何化多轴科技路线。
- 品牌官方参考：[MiSans](https://hyperos.mi.com/font/zh/download/)、[HarmonyOS Sans](https://developer.huawei.com/consumer/cn/design/resource/)、[OPPO Sans](https://www.coloros.com/article/A00000050/)、[HONOR Sans](https://developer.honor.com/cn/doc/guides/100681)、[vivo Sans](https://www.vivo.com/hk/zh/originos)、[京东朗正体](https://jdrdl.jd.com/Brand-Font.html)、[钉钉进步体](https://page.dingtalk.com/wow/dingtalk/default/dingtalk/y-W5aF3_ZJwzulU0nceIl)、[阿里巴巴字体](https://www.alibabafonts.com/)。这些字体不能因“免费”而被标成开源，必须按官方下载协议处理。

上列字体通常以 SIL OFL 1.1 或相应开源许可证发布，但下载、再分发、子集化和商用仍要保留 LICENSE。`font-catalog.yaml` 只给选择索引，不替用户完成许可证审查。

## 明确不采用的做法

1. 不把“10 个主题”或“22 个锁定版式”变成网页固定模板；页面任务和内容优先。
2. 不把 PDF/幻灯片的页边距、字号或导出脚本硬搬到浏览器。
3. 不宣称某个开源 Skill 会自动调用 VLM、自动生成视频或自动发布网页；这些是执行环境能力，不是本 Skill 的保证。
4. 不默认推荐许可证不清晰、字形来源不透明或只覆盖日文的字体。

## 本地扩展索引

仓库内已有的中文字体与排版来源汇总仍保留在 [`OPEN_SOURCE_CHINESE_FONT_AND_TYPOGRAPHY_SKILLS.md`](../../OPEN_SOURCE_CHINESE_FONT_AND_TYPOGRAPHY_SKILLS.md)。本 Skill 的 `font-catalog.yaml` 是可执行工作流需要的精简索引；需要更多候选时先阅读该汇总，再把具体字体的区域、字形覆盖和许可证写入项目交付物。
