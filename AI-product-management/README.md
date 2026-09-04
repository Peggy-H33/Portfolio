# AI产品经理项目经历 | AI Product Management

[English Version](#english-version)

本目录收录我在 AI 产品经理实习期间独立跟进的项目。材料覆盖市场与竞品研究、产品方案、PRD、流程与状态设计、页面设计，以及通过 Vibe Coding 制作的高保真交互 Demo。

## 工作方式

```text
问题与目标定义
      ↓
市场 / 竞品 / 技术形态调研
      ↓
产品方案、边界与优先级
      ↓
PRD、流程、状态与验收标准
      ↓
Vibe Coding 高保真交互原型
      ↓
评审、验证与迭代
```

## 项目总览

| 项目 | 核心范围 | 主要产出 | 当前阶段 |
| --- | --- | --- | --- |
| [Agent Team 产品研究与设计](./agent-team-product-research-and-design/) | 多 Agent 协作形态、团队组建、角色分工、运行流程与产品化边界 | 市场与竞品研究、桌面端本地 Agent Team 方案、Web 设计 Agent Team 方案与运行手册 | 两套产品均已推进一期，部分能力仍在研究与迭代 |
| [登录与 Token Plan 支付流程重构](./authentication-and-token-plan-payment-flow-refactor/) | 功能型产品页面、登录跳转、推广入口、充值、续费与实例生命周期 | 完整 PRD、流程与状态规则、页面截图、Vibe Coding 高保真交互 Demo | PRD 与演示材料已完成 |
| [图片、视频生成页面改版](./image-video-generation-page/) | 创作输入、图片 / 视频切换、素材中心、生成任务、作品管理与发布流程 | 完整 PRD、页面说明图、Web / H5 两版 Demo、本地 Node 后端与真实 API 对接能力 | PRD 与演示材料已完成；部分内部发布能力暂不进入开发 |

## 1. Agent Team 产品研究与设计

[进入项目目录](./agent-team-product-research-and-design/)

这个项目从 Agent Team 的市场形态和协作机制出发，进一步形成两个具体产品场景的方案。

```text
agent-team-product-research-and-design/
├── competitive-research-and-analysis/   市场格局、重点竞品与技术形态研究
├── sowork-desktop-agent-team/            客户端本地 Agent 产品的 Agent Team 方案
└── web-design-agent-team/                Web 端设计产品的 Agent Team 方案与运行手册
```

| 子项目 | 关注问题 | 代表材料 |
| --- | --- | --- |
| [competitive-research-and-analysis](./agent-team-product-research-and-design/competitive-research-and-analysis/) | Agent Team、Agent 群聊、Swarm、专家团等产品形态；重点竞品流程、能力边界、成本、工程要求与公开证据 | [初步调研](./agent-team-product-research-and-design/competitive-research-and-analysis/agent-team-initial-research.md) · [市场格局与重点产品研究](./agent-team-product-research-and-design/competitive-research-and-analysis/agent-team-market-landscape-and-key-product-research.md) |
| [sowork-desktop-agent-team](./agent-team-product-research-and-design/sowork-desktop-agent-team/) | 主 Agent 如何组建团队、Subagent 来源、用户确认节点、生命周期与通信损耗 | [产品方案](./agent-team-product-research-and-design/sowork-desktop-agent-team/sowork-agent-team-product-proposal.md) |
| [web-design-agent-team](./agent-team-product-research-and-design/web-design-agent-team/) | 将 Style、Typography、Image、Video、Layout、Review 等角色组织成可交接、可复验的设计生产流程 | [双语运行手册](./agent-team-product-research-and-design/web-design-agent-team/web-design-agent-team-handbook.md) · [团队结构图](./agent-team-product-research-and-design/web-design-agent-team/web-design-agent-team-diagram.png) |

## 2. 登录与 Token Plan 支付流程重构

[进入项目目录](./authentication-and-token-plan-payment-flow-refactor/)

该项目围绕功能型产品的访问、开通和续费链路，统一页面入口、身份状态和支付相关逻辑。

| 范围 | 内容 |
| --- | --- |
| 页面与入口 | 功能页面设计、官网 / 侧边栏 / Showcase 等入口及展示状态 |
| 登录与开通 | 登录弹窗、身份选择、登录后跳转、S-Design 开通逻辑 |
| Token Plan | 推广跳转、订阅、充值、续费、过期提醒与实例生命周期 |
| 产品规则 | 状态定义、交互逻辑、联调依赖、建议埋点、验收标准与待确认事项 |

主要文件：

- [完整 PRD：authentication-and-token-plan-payment-flow-refactor-prd.md](./authentication-and-token-plan-payment-flow-refactor/authentication-and-token-plan-payment-flow-refactor-prd.md)
- [Vibe Coding 高保真交互 Demo：interactive-demo.html](./authentication-and-token-plan-payment-flow-refactor/interactive-demo.html)

## 3. SenseAudio 图片 / 视频生成页面改版

[进入项目目录](./image-video-generation-page/)

该项目针对图片与视频生成功能的落地页面进行改版，重点覆盖创作入口、素材检索、任务反馈和作品管理。

| 模块 | 主要设计内容 |
| --- | --- |
| 创作输入 | 固定底部输入框、展开 / 收起、图片 / 视频模式、比例与清晰度、参考图上传 |
| 素材中心 | 搜索、类型筛选、素材卡片悬停操作、图片 / 视频详情弹窗 |
| 我的创作 | 生成任务、进度与操作、历史作品、搜索和删除 |
| 发布与审核 | 投稿入口、授权、审核状态和投稿记录；当前作为后续能力保留 |

主要文件：

- [完整 PRD：senseaudio-image-video-generation-page-revision-prd.md](./image-video-generation-page/senseaudio-image-video-generation-page-revision-prd.md)
- [Web 产品 Demo](./image-video-generation-page/demo/user-facing-demo.html)
- [H5 产品 Demo](./image-video-generation-page/demo/initial-user-facing-h5-demo.html)
- [本地后端及启动说明](./image-video-generation-page/demo/backend/README.md)

两版 Demo 均用于产品流程和交互评审。其中本地 Node 后端可连接真实 SenseAudio 图片 / 视频生成接口；实际调用需要按后端说明配置有效 API Key。

## 关于原型与项目边界

- 本目录中的 HTML Demo 是通过 Vibe Coding 完成的高保真产品原型，用于验证产品流程、页面状态和交互体验，并非生产环境代码。
- Agent Team 两套方案均已推进一期，部分功能仍处于研究、验证或迭代阶段。
- 部分 Demo 的真实生成能力依赖有效 API Key、本地 Node 后端及上游接口可用性。

[返回作品集首页](../README.md)

---

## English Version

This directory contains projects I independently followed during an AI product management internship. The artifacts cover market and competitor research, product proposals, PRDs, flow and state design, page design, and high-fidelity interactive demos created through vibe coding.

### Working Process

```text
Problem and objective definition
          ↓
Market / competitor / technical-pattern research
          ↓
Product proposal, scope, and priorities
          ↓
PRD, flows, states, and acceptance criteria
          ↓
High-fidelity vibe-coded prototype
          ↓
Review, validation, and iteration
```

### Project Overview

| Project | Core scope | Key deliverables | Stage |
| --- | --- | --- | --- |
| [Agent Team Product Research & Design](./agent-team-product-research-and-design/) | Multi-agent collaboration patterns, team assembly, roles, runtime flow, and product boundaries | Market and competitor research, a local desktop Agent Team proposal, a web-design Agent Team proposal, and an operating handbook | Both product tracks have progressed through Phase 1; selected capabilities remain under research and iteration |
| [Authentication & Token Plan Payment Flow Refactor](./authentication-and-token-plan-payment-flow-refactor/) | Functional product pages, authentication redirects, promotional entry points, top-up, renewal, and instance lifecycle | Complete PRD, flow and state rules, page references, and a high-fidelity vibe-coded demo | PRD and demo artifacts completed |
| [SenseAudio Image / Video Generation Page Revision](./image-video-generation-page/) | Creation input, image / video switching, asset center, generation tasks, work management, and publishing flow | Complete PRD, annotated screens, web and H5 demos, plus a local Node backend capable of real API integration | PRD and demos completed; selected internal publishing capabilities are deferred |

### 1. Agent Team Product Research & Design

[Open the project directory](./agent-team-product-research-and-design/)

This project begins with market patterns and collaboration mechanisms for Agent Teams, then translates the research into proposals for two concrete product contexts.

```text
agent-team-product-research-and-design/
├── competitive-research-and-analysis/   Market landscape, competitors, and technical patterns
├── sowork-desktop-agent-team/            Agent Team proposal for a local desktop agent product
└── web-design-agent-team/                Agent Team proposal and handbook for a web design product
```

| Subproject | Focus | Representative artifacts |
| --- | --- | --- |
| [competitive-research-and-analysis](./agent-team-product-research-and-design/competitive-research-and-analysis/) | Agent Teams, agent group chats, swarms, expert teams, competitor flows, capability boundaries, costs, engineering requirements, and public evidence | [Initial research](./agent-team-product-research-and-design/competitive-research-and-analysis/agent-team-initial-research.md) · [Market landscape and key-product research](./agent-team-product-research-and-design/competitive-research-and-analysis/agent-team-market-landscape-and-key-product-research.md) |
| [sowork-desktop-agent-team](./agent-team-product-research-and-design/sowork-desktop-agent-team/) | Main-agent team assembly, subagent sources, user confirmation, lifecycle, and communication overhead | [Product proposal](./agent-team-product-research-and-design/sowork-desktop-agent-team/sowork-agent-team-product-proposal.md) |
| [web-design-agent-team](./agent-team-product-research-and-design/web-design-agent-team/) | Organizing Style, Typography, Image, Video, Layout, and Review roles into a handoff-driven, verifiable production workflow | [Bilingual operating handbook](./agent-team-product-research-and-design/web-design-agent-team/web-design-agent-team-handbook.md) · [Team diagram](./agent-team-product-research-and-design/web-design-agent-team/web-design-agent-team-diagram.png) |

### 2. Authentication & Token Plan Payment Flow Refactor

[Open the project directory](./authentication-and-token-plan-payment-flow-refactor/)

This project unifies page entry points, identity states, activation, and payment-related logic for a functional product experience.

| Scope | Contents |
| --- | --- |
| Pages and entry points | Functional page design plus website, sidebar, and Showcase entries and their display states |
| Authentication and activation | Login dialog, identity selection, post-login redirects, and S-Design activation logic |
| Token Plan | Promotion redirects, subscription, top-up, renewal, expiration reminders, and instance lifecycle |
| Product rules | State definitions, interaction logic, integration dependencies, suggested analytics, acceptance criteria, and open questions |

Key files:

- [Complete PRD: authentication-and-token-plan-payment-flow-refactor-prd.md](./authentication-and-token-plan-payment-flow-refactor/authentication-and-token-plan-payment-flow-refactor-prd.md)
- [High-fidelity vibe-coded demo: interactive-demo.html](./authentication-and-token-plan-payment-flow-refactor/interactive-demo.html)

### 3. SenseAudio Image / Video Generation Page Revision

[Open the project directory](./image-video-generation-page/)

This project revises a functional image- and video-generation landing experience, focusing on creation entry, asset discovery, task feedback, and creation management.

| Module | Product design scope |
| --- | --- |
| Creation input | Fixed-bottom composer, expanded / collapsed states, image / video modes, ratio and resolution controls, and reference-image upload |
| Asset center | Search, type filters, card-hover actions, and image / video detail dialogs |
| My Creations | Generation tasks, progress and actions, history, search, and deletion |
| Publishing and review | Submission entry, authorization, review states, and submission records, retained as a future capability |

Key files:

- [Complete PRD: senseaudio-image-video-generation-page-revision-prd.md](./image-video-generation-page/senseaudio-image-video-generation-page-revision-prd.md)
- [Web product demo](./image-video-generation-page/demo/user-facing-demo.html)
- [H5 product demo](./image-video-generation-page/demo/initial-user-facing-h5-demo.html)
- [Local backend and run instructions](./image-video-generation-page/demo/backend/README.md)

Both demos support product-flow and interaction review. The local Node backend can connect to the real SenseAudio image and video generation APIs; actual requests require a valid API key configured according to the backend instructions.

### Prototype and Scope Notes

- The HTML demos in this directory are high-fidelity product prototypes built through vibe coding to validate flows, states, and interactions; they are not production deployments.
- Both Agent Team proposals have progressed through Phase 1, while selected capabilities remain under research, validation, or iteration.
- Real generation in the SenseAudio demos depends on a valid API key, the local Node backend, and upstream API availability.

[Back to portfolio home](../README.md)
