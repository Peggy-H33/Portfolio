# 网页艺术指导与生产 Skill | Web Art Direction & Production Skill

[English Version](#english-version)

> 状态：在研。此目录为公开概况版，不包含可直接运行或还原完整 Skill 的执行指令、参考库、模板和脚本。

## 解决的问题

许多 AI 网页生成流程可以完成页面结构，却容易出现模板化构图、媒体与文字脱节、视觉风格前后不一致，以及只检查代码而不检查真实成片的问题。该 Skill 将网页设计组织成可执行的艺术指导与生产流程，使需求、视觉方向、页面构图、动态媒体、响应式实现和最终截图验收保持一致。

## 能力概况

| 阶段 | 关注点 | 产出类型 |
| --- | --- | --- |
| 需求与证据 | 识别页面目标、受众、内容优先级和参考证据 | 结构化设计简报 |
| 艺术方向 | 建立主题化视觉语言、媒体角色和页面节奏 | 艺术方向与页面计划 |
| 页面实现 | 协调布局、色彩、材质、组件、动效和媒体 | 响应式网页实现 |
| 协作接口 | 与中文字体 Skill 交换局部排版约束，同时保持整体媒体与结构稳定 | 清晰的能力边界 |
| 质量验证 | 通过桌面端、移动端、动态状态与全页截图检查最终成片 | QA 记录与修订闭环 |

## 完整包的高层结构

```text
web-design-skill/
├── SKILL.md       触发范围、执行流程与质量门槛
├── references/    设计模块、模式库、契约与验证规范
├── assets/        页面起步模板与研究记录模板
├── scripts/       结构检查和输出验证工具
└── agents/        Skill 展示与调用元数据
```

## 可查看的结果

完整方法的实际效果保留在 [web-design-skill-showcase](../web-design-skill-showcase/) 中，可从最终网页、桌面端与移动端截图、过程材料和 QA 记录判断其设计效果。

## 公开范围

公开版本用于说明该 Skill 的问题定义、能力模块和工程化结构。完整规则、参数、执行顺序、参考资料及自动验证实现属于当前在研内容，暂不公开。

[返回 Web Design Skill 体系](../README.md)

---

## English Version

> Status: active R&D. This public overview intentionally excludes executable instructions, reference libraries, templates, and scripts that would reproduce the complete Skill.

### Problem Addressed

AI-generated websites can satisfy structural requirements while still producing template-like composition, disconnected media and typography, inconsistent art direction, or code-only QA. This Skill turns web design into an executable art-direction and production workflow that keeps the brief, visual direction, page composition, motion media, responsive implementation, and final screenshot review aligned.

### Capability Overview

| Stage | Focus | Output type |
| --- | --- | --- |
| Brief and evidence | Page goal, audience, content priorities, and reference evidence | Structured design brief |
| Art direction | Subject-specific visual language, media roles, and page rhythm | Art-direction and page plan |
| Implementation | Layout, color, material, components, motion, and media | Responsive web implementation |
| Skill integration | Coordinates local typography constraints while preserving macro structure and media direction | Explicit ownership boundary |
| Quality verification | Reviews desktop, mobile, motion states, and full-page screenshots | QA evidence and revision loop |

### Full-Package Architecture

```text
web-design-skill/
├── SKILL.md       Trigger scope, workflow, and quality gates
├── references/    Design modules, pattern libraries, contracts, and review rules
├── assets/        Starter and study templates
├── scripts/       Structural and output validators
└── agents/        Skill presentation metadata
```

The public edition documents the problem framing, capability modules, and engineering structure. Detailed rules, parameters, sequencing, references, and validators remain private while the Skill is under development. Public outcomes are available in the [showcase](../web-design-skill-showcase/).

[Back to the Web Design Skill system](../README.md)
