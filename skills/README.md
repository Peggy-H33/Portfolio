# AI Skills 与可复用工作流 | AI Skills & Reusable Workflows

[English Version](#english-version)

本目录收录我自主制作以及与同伴协作完成的 AI Skills。它们不是单次 Prompt，而是把触发条件、执行流程、参考资料、脚本、资产和验证规则组织成可复用的任务能力。

## Skill 总览

| Skill / 项目 | 类型 | 解决的问题 | 主要产出 |
| --- | --- | --- | --- |
| [editable-html](./editable-html/) | 工具型 Skill | 当用户提出“可编辑 HTML / 网页”需求时，为生成页面加入浏览器内编辑能力 | 阅读 / 编辑模式切换、类 Word 工具栏、文本与图片编辑、撤销 / 重做、保存 HTML、打印 |
| [web-design](./web-design/) | 设计类 Skill 体系 | 将分散的网页设计经验转化为结构化、可执行、可验证的设计工作流 | 两个在研核心 Skill 的公开概况、基本结构、生成案例与 QA 过程材料 |

## 1. Editable HTML

[查看 Skill 文件](./editable-html/SKILL.md)

`editable-html` 是一个呈现插件式能力的工具型 Skill。当请求中明确提到“可编辑 HTML”“可编辑网页”或希望直接在浏览器里修改页面内容时，它会在正常网页设计之外加入一套自包含编辑器。

| 能力 | 说明 |
| --- | --- |
| 双模式 | 默认以不可编辑的阅读模式打开；切换到编辑模式后显示完整工具栏 |
| 文本编辑 | 标题 / 正文样式、字号、粗体、斜体、下划线、删除线、颜色、高亮、格式刷与清除格式 |
| 图片编辑 | 插入、选择、缩放与删除图片，并将插入图片保存为内嵌数据 |
| 编辑闭环 | 撤销 / 重做、打印、下载包含当前修改的 HTML；重新打开后仍保留编辑器 |
| 集成方式 | 使用独立 CSS、JavaScript、编辑器 UI 模板及注入脚本，为目标 HTML 加入编辑能力 |

## 2. Web Design Skill 体系

[进入 web-design](./web-design/)

该体系从 300+ 网页前端设计 Prompt 中提取可复用模式，再按照 Skill Tree 组织成设计、字体、媒体、动效、响应式和质量验证模块。两个核心 Skill 仍在持续研发，公开仓库仅展示能力概况和高层结构，完整执行包不公开。

```text
300+ 网页设计 Prompts
          ↓
设计模式拆解与归类
          ↓
Skill Tree 与执行协议
          ↓
├── web-design-skill                 整体视觉与网页生产流程（公开概况版）
├── chinese-typography-web-design    中文字体选择与排版系统（公开概况版）
└── web-design-skill-showcase        生成案例、过程材料与 QA 证据
```

### 核心组件

| 目录 | 作用 | 覆盖内容 |
| --- | --- | --- |
| [web-design-skill](./web-design/web-design-skill/) | 整体风格与页面生产 Skill | 公开问题定义、能力模块、输入输出与完整包的高层目录结构 |
| [chinese-typography-web-design](./web-design/chinese-typography-web-design/) | 中文字体与排版 Skill | 公开字体设计问题、能力模块、协作边界与完整包的高层目录结构 |
| [web-design-skill-showcase](./web-design/web-design-skill-showcase/) | 生成效果与验证记录 | 完整网页、字体、图片 / 视频资产、研究过程、桌面 / 移动端截图及 QA 材料 |

两个核心 Skill 组合使用时，目标是生成具有清晰信息层级、主题化字体、非模板化构图、动态媒体或背景，并经过桌面端与移动端检查的网页设计。完整规则、参考库、模板、Schema 与验证脚本因仍在研而保存在私有仓库。

### 示例项目

| 示例 | 内容 |
| --- | --- |
| [green-ecology-regenerated](./web-design/web-design-skill-showcase/green-ecology-regenerated/) | 绿色生态主题网页，包含本地字体、视频媒体、响应式页面和完整研究 / QA 记录 |
| [shanghai-luxe-stays](./web-design/web-design-skill-showcase/shanghai-luxe-stays/) | 上海旅居主题网页，包含字体系统、动态媒体、响应式布局与视觉质量检查材料 |

## 使用与阅读说明

- `editable-html` 保留完整的 `SKILL.md` 与实现；两个 Web Design 核心 Skill 的公开目录仅提供 README 概况。
- Web Design 完整包采用 `SKILL.md`、`references/`、`assets/`、`scripts/` 和 `agents/` 的工程结构，但具体文件不在公开仓库披露。
- Showcase 中保留了研究与 QA 过程，便于查看生成结果之外的设计决策和验证方式。

[返回作品集首页](../README.md)

---

## English Version

This directory contains AI Skills created independently or in collaboration with others. They are not one-off prompts: each Skill packages trigger conditions, an execution workflow, references, scripts, assets, and validation rules into a reusable capability.

### Skill Overview

| Skill / project | Type | Problem addressed | Main output |
| --- | --- | --- | --- |
| [editable-html](./editable-html/) | Utility Skill | Adds in-browser editing when a user asks for an editable HTML page | Reading / editing modes, Word-like toolbar, text and image editing, undo / redo, HTML download, and printing |
| [web-design](./web-design/) | Design Skill system | Converts fragmented web-design experience into a structured, executable, and verifiable workflow | Public overviews and high-level architecture for two in-progress core Skills, plus generated showcases and QA artifacts |

### 1. Editable HTML

[Open the Skill definition](./editable-html/SKILL.md)

`editable-html` is a utility Skill with plugin-like behavior. When a request explicitly asks for an “editable HTML” or a page whose content can be changed in the browser, the Skill adds a self-contained editor on top of the requested page design.

| Capability | Description |
| --- | --- |
| Two modes | Opens in non-editable reading mode and reveals the full toolbar only in editing mode |
| Text editing | Block styles, font size, bold, italic, underline, strike-through, colors, highlights, format painter, and clear formatting |
| Image editing | Insert, select, resize, and delete images, with inserted images stored as embedded data |
| Editing loop | Undo / redo, print, and download the current page as HTML while retaining the editor for future editing |
| Integration | Uses standalone CSS, JavaScript, an editor UI template, and an injection script to add editing to a target HTML file |

### 2. Web Design Skill System

[Open web-design](./web-design/)

This system distills reusable patterns from 300+ front-end design prompts and organizes them into a Skill Tree covering art direction, typography, media, motion, responsive behavior, and quality verification. Both core Skills remain under active development; the public repository presents their capability summaries and high-level architecture rather than the complete execution packages.

```text
300+ web-design prompts
          ↓
Pattern decomposition and classification
          ↓
Skill Tree and execution contracts
          ↓
├── web-design-skill                 End-to-end visual and web-production workflow (public overview)
├── chinese-typography-web-design    Chinese font selection and typography system (public overview)
└── web-design-skill-showcase        Generated examples, process artifacts, and QA evidence
```

#### Core Components

| Directory | Role | Coverage |
| --- | --- | --- |
| [web-design-skill](./web-design/web-design-skill/) | Core style and page-production Skill | Public problem framing, capability modules, inputs/outputs, and high-level full-package structure |
| [chinese-typography-web-design](./web-design/chinese-typography-web-design/) | Chinese typography Skill | Public typography problem framing, capability modules, collaboration boundary, and high-level full-package structure |
| [web-design-skill-showcase](./web-design/web-design-skill-showcase/) | Generated work and validation records | Complete pages, fonts, image / video assets, studies, desktop / mobile screenshots, and QA artifacts |

When combined, the two core Skills are designed to produce web experiences with clear information hierarchy, theme-aware typography, non-template composition, dynamic media or backgrounds, and desktop / mobile verification. Detailed rules, references, templates, schemas, and validators remain in a private repository while development continues.

#### Showcase Projects

| Example | Contents |
| --- | --- |
| [green-ecology-regenerated](./web-design/web-design-skill-showcase/green-ecology-regenerated/) | Green-ecology themed site with local fonts, video media, responsive pages, and full study / QA records |
| [shanghai-luxe-stays](./web-design/web-design-skill-showcase/shanghai-luxe-stays/) | Shanghai-stay themed site with a font system, dynamic media, responsive layouts, and visual-quality checks |

### Usage and Reading Notes

- `editable-html` retains its complete `SKILL.md` and implementation; the two public Web Design Skill folders contain README overviews only.
- The complete Web Design packages use `SKILL.md`, `references/`, `assets/`, `scripts/`, and `agents/`, but their implementation files are intentionally excluded from the public repository.
- The showcases retain study and QA artifacts so reviewers can inspect design decisions and validation methods, not only final outputs.

[Back to portfolio home](../README.md)
