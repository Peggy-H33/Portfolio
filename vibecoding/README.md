# 个人vibecoding项目 | Personal vibecoding Projects

[English Version](#english-version)

本目录收录我独立完成的vibecoding项目，包括产品概念原型、个人网站设计和自由想法的落地实现。项目中会根据需要独立完成前端设计、交互逻辑、后端接口或工作流设计。

## 项目一览

| 项目 | 项目内容 | 主要材料 | 状态说明 |
| --- | --- | --- | --- |
| [Career Studio](./vibecoding_careerstudio_demo/) | 面向求职场景的产品概念原型，包含简历与 JD 匹配、面试记录和面试准备等流程 | [项目流程文档](./vibecoding_careerstudio_demo/Project%20Workflow%20Document.pdf) · [HTML 原型](./vibecoding_careerstudio_demo/career-studio-preview.html) | 前端原型可查看；AI 生成结果为模拟内容，不包含生产后端；完整案例说明仍在整理 |
| [滚动叙事个人作品集网站](./personal-portfolio-website/) | 独立通过vibecoding完成的网站设计作品，以滚动驱动 600 帧连续画面，构成两页电影式个人作品集叙事 | [项目说明](./personal-portfolio-website/README.md) · [HTML 入口](./personal-portfolio-website/index.html) · [页面预览](./personal-portfolio-website/tests/artifacts/page-1.png) | 可本地运行；包含响应式交互、状态机、测试和发布优化后的网页帧序列 |

## 滚动叙事个人作品集网站

![滚动叙事个人作品集网站预览](./personal-portfolio-website/tests/artifacts/page-1.png)

这是一个独立完成的网页视觉与交互实验。页面不是通过普通长页面堆叠内容，而是把滚动输入映射到连续画面，让访问者通过滚轮、触控或键盘推进和反向查看叙事。

| 设计 / 实现维度 | 内容 |
| --- | --- |
| 叙事方式 | 两页全屏结构，以 600 帧连续画面组织电影式滚动叙事 |
| 交互输入 | 支持鼠标滚轮、触控滑动、方向键、Page Up / Page Down 和空格键 |
| 技术实现 | 原生 HTML、CSS、JavaScript、Canvas 帧绘制和可独立测试的状态机 |
| 响应式处理 | 根据视口和设备像素比重绘 Canvas，并适配桌面端与移动端 |
| 资源优化 | 将原始 8K JPEG 帧转换为 2560×1440 WebP，600 帧由约 642 MB 降至约 75 MB |
| 质量验证 | 包含状态机边界测试、浏览器交互测试、字体与 Canvas 检查及页面截图 |

项目结构：

```text
vibecoding/
├── vibecoding_careerstudio_demo/    Career Studio 求职产品原型
└── personal-portfolio-website/      滚动叙事个人作品集网站
```

## 后续补充计划

Career Studio 的完整项目背景、个人决策、演示素材和复盘仍会继续整理；未来新增的独立项目也会按照“背景与目标 → 用户问题 → 个人职责与取舍 → Demo → 实现方式 → 验证与复盘”的结构补充。

[返回作品集首页](../README.md)

---

## English Version

This directory contains vibecoding projects that I completed independently, including product-concept prototypes, personal website design, and working implementations of independent ideas. Depending on the project, I handle front-end design, interaction logic, backend API integration, or workflow design independently.

### Project Overview

| Project | What it is | Main artifacts | Status |
| --- | --- | --- | --- |
| [Career Studio](./vibecoding_careerstudio_demo/) | A product-concept prototype for job-search workflows, including resume–JD matching, interview logging, and interview preparation | [Project workflow document](./vibecoding_careerstudio_demo/Project%20Workflow%20Document.pdf) · [HTML prototype](./vibecoding_careerstudio_demo/career-studio-preview.html) | The front-end prototype is available; AI-generated results are mocked and no production backend is included. Full case-study documentation is still in progress |
| [Scroll-Driven Personal Portfolio Website](./personal-portfolio-website/) | A website-design project built independently through vibecoding, using scrolling to drive 600 consecutive frames across a cinematic two-page portfolio narrative | [Project README](./personal-portfolio-website/README.md) · [HTML entry point](./personal-portfolio-website/index.html) · [Page preview](./personal-portfolio-website/tests/artifacts/page-1.png) | Runs locally and includes responsive interaction, a state machine, tests, and a web-optimized frame sequence |

### Scroll-Driven Personal Portfolio Website

![Preview of the scroll-driven personal portfolio website](./personal-portfolio-website/tests/artifacts/page-1.png)

This is an independently completed visual and interaction experiment for the web. Instead of arranging content as a conventional long page, it maps user input to a continuous image sequence so visitors can move the story forward or backward with a mouse wheel, touch gesture, or keyboard.

| Design / implementation area | Details |
| --- | --- |
| Narrative approach | A two-page, full-screen structure organized as a cinematic 600-frame scroll story |
| Input methods | Mouse wheel, touch gestures, arrow keys, Page Up / Page Down, and the space bar |
| Technical implementation | Native HTML, CSS, JavaScript, Canvas frame rendering, and an independently testable state machine |
| Responsive behavior | Redraws the Canvas for the viewport and device pixel ratio and adapts across desktop and mobile layouts |
| Asset optimization | Converts the original 8K JPEG frames to 2560×1440 WebP, reducing the 600-frame sequence from approximately 642 MB to approximately 75 MB |
| Quality verification | Includes state-machine boundary tests, browser interaction tests, font and Canvas checks, and page screenshots |

Directory structure:

```text
vibecoding/
├── vibecoding_careerstudio_demo/    Career Studio job-search product prototype
└── personal-portfolio-website/      Scroll-driven personal portfolio website
```

### Planned Additions

The full Career Studio context, personal decisions, demo materials, and retrospective will continue to be organized. Future independent projects will follow a consistent structure: context and objective → user problem → personal role and trade-offs → demo → implementation approach → validation and retrospective.

[Back to portfolio home](../README.md)
