# 中文网页字体设计 Skill | Chinese Web Typography Skill

[English Version](#english-version)

> 状态：在研。此目录为公开概况版，不包含可直接运行或还原完整 Skill 的字体目录、选择规则、计划 Schema、执行指令和验证脚本。

## 解决的问题

中文网页常被套用默认无衬线字体，或者只在 Hero 使用一款装饰字，导致主题感、全页层级、长文可读性和移动端断行彼此割裂。该 Skill 将字体选择、真实字形试排、全页文字角色、授权检查和响应式验证组织为一套可复用流程。

## 能力概况

| 模块 | 关注点 | 产出类型 |
| --- | --- | --- |
| 文字表面盘点 | 品牌、导航、标题、正文、引语、CTA、图注和控件的完整覆盖 | 全页字体角色清单 |
| 字体候选 | 结合主题语义、字形类别、授权来源和使用场景组织候选 | 模块级候选方案 |
| 真实试排 | 使用真实中文、真实字号、背景和容器检查字形与断行 | 字体对比与排版证据 |
| 全局层级 | 平衡签名字体、表现型字体、阅读字体和界面字体 | 全页字体系统 |
| 响应式验证 | 检查桌面、移动端、缩放、字体加载失败和明暗媒体状态 | 可验证的字体计划 |

## 完整包的高层结构

```text
chinese-typography-web-design/
├── SKILL.md       触发范围、职责边界与执行流程
├── references/    字体知识、授权信息、排版规则与计划规范
├── assets/        字体试排页面与计划示例
├── scripts/       候选推荐、字体下载及计划验证工具
└── agents/        Skill 展示与调用元数据
```

## 与网页设计 Skill 的关系

网页设计 Skill 负责整体艺术方向、页面结构、媒体和动效；中文字体 Skill 在这些约束下负责真实字形与局部文字几何。两者通过明确的输入输出边界协作，避免字体优化无意改变页面主题与媒体构图。

## 公开范围

公开版本保留问题定义、能力结构和协作方式；完整字体库、筛选逻辑、门槛参数、Schema 与验证程序属于当前在研内容，暂不公开。实际生成效果可在 [web-design-skill-showcase](../web-design-skill-showcase/) 查看。

[返回 Web Design Skill 体系](../README.md)

---

## English Version

> Status: active R&D. This public overview excludes the font catalog, selection rules, planning schemas, execution instructions, and validators needed to reproduce the complete Skill.

### Problem Addressed

Chinese web pages often fall back to a default sans serif or use one decorative face only in the hero, leaving theme expression, page-wide hierarchy, long-form readability, and mobile line breaks disconnected. This Skill organizes font selection, real-glyph trials, full-page text roles, licensing checks, and responsive verification into a reusable workflow.

### Capability Overview

| Module | Focus | Output type |
| --- | --- | --- |
| Surface inventory | Full coverage of brand, navigation, headings, body, quotations, CTAs, captions, and controls | Page-wide typography-role inventory |
| Font candidates | Subject meaning, type category, licensing source, and usage context | Module-level candidate sets |
| Real-glyph trials | Actual Chinese copy, font size, background, and container geometry | Comparison and layout evidence |
| Global hierarchy | Balance among signature, expressive, reading, and interface faces | Coherent page-wide type system |
| Responsive validation | Desktop, mobile, zoom, fallback, and bright/dark media states | Verifiable typography plan |

### Full-Package Architecture

```text
chinese-typography-web-design/
├── SKILL.md       Trigger scope, ownership boundary, and workflow
├── references/    Font knowledge, licensing, typography rules, and plan specifications
├── assets/        Font specimens and planning examples
├── scripts/       Candidate, download, and validation tools
└── agents/        Skill presentation metadata
```

The web-design Skill owns macro art direction, structure, media, and motion. The typography Skill works inside those constraints to refine real glyphs and local copy geometry. The public edition retains this problem framing, capability architecture, and collaboration model; detailed catalogs, rules, thresholds, schemas, and validators remain private during development. See the [showcase](../web-design-skill-showcase/) for visible results.

[Back to the Web Design Skill system](../README.md)
