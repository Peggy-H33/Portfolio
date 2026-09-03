# 幕间（Interlude）｜AI 角色创作平台交互原型

[English Version](#english-version)

> 让作者笔下的角色，在文字之外继续生活。

![幕间角色记忆星图预览](./public/og.png)

“幕间”是我独立通过 vibecoding 设计并实现的个人创作平台原型。项目源于我对写作的长期兴趣：我希望作品中的人物不只停留在正文里，而能在作者可控的世界观、记忆与行为规则下继续互动、形成关系，并把有价值的新细节重新带回创作过程。

当前版本重点验证一条完整产品闭环：**多角色对话 → 候选记忆提取 → 作者编辑与确认 → 写入作品正典 → Skill 调整与角色试演**。

## 产品设计

| 维度 | 设计内容 |
| --- | --- |
| 目标用户 | 原创小说作者、同人创作者与互动叙事创作者 |
| 核心价值 | 让角色持续互动，同时避免角色越权知情、世界观串线和 AI 自动污染正典 |
| 角色系统 | 每个角色由档案、Prompt、可解释 Skill、Memory、关系和声音配置共同组成 |
| 对话机制 | 支持单聊、群聊、观察与重演分支；角色可按照各自人设与已知信息互相接话 |
| 记忆治理 | AI 衍生内容默认进入候选区，作者可修改客观事实与不同角色/读者视角后，再决定是否收录为正典 |
| 创作控制 | 支持 Skill 编辑、试演、版本思路、认知矩阵、时间线与分支隔离 |
| 体验语言 | 以电影片场、编剧室和场记连续性板为视觉隐喻，提供暗色放映厅与浅色剧本桌两种模式 |

完整的产品背景、信息架构、核心流程、数据模型、MVP 范围、指标与风险分析见 [PRD.md](./PRD.md)。

## 原型已实现能力

- 全屏作品库与多作品入口；
- 角色群聊、快捷提问和预设的多角色接话；
- 候选记忆编辑、认知矩阵与“收录为正典”流程；
- 故事星图、角色空间、角色 Skill 编辑与单句试演；
- 正文阅读、AI 分场结果展示和场景对白预演；
- 深浅主题切换、桌面与移动端响应式布局；
- 使用浏览器 `localStorage` 保存原型中的对话、Memory、Skill 与阅读状态。

## 技术实现

| 类别 | 内容 |
| --- | --- |
| 前端 | Next.js 16、React 19、TypeScript、CSS、Lucide React |
| 构建与运行 | Vinext、Vite、Cloudflare Worker 本地运行配置 |
| 数据 | 当前原型不连接服务端数据库；交互状态保存在浏览器本地 |
| 质量验证 | ESLint、服务端渲染检查、关键产品文案与资源完整性测试 |

## 本地运行

环境要求：Node.js `>=22.13.0`。

```bash
git clone https://github.com/Peggy-H33/Portfolio.git
cd Portfolio/vibecoding/mujian-creative-writing-platform
npm ci
npm run dev
```

浏览器打开 `http://localhost:3000/`。

也可以运行：

```bash
npm run lint
npm test
```

## 推荐体验路径

1. 从作品库进入《雾港来信》，在“对话现场”阅读林栀和沈砚的群聊，或点击快捷问题后发送；
2. 在右侧“导演台”点击“查看并收录”；
3. 修改客观事实与四个视角，然后点击“收录为正典”；
4. 切回“故事星图”，点击角色进入角色空间；
5. 进入角色 Skill，编辑“被戳穿时先反问”并试演一句；
6. 刷新页面检查本地保存，或使用左下角“恢复演示”回到初始状态。

## 原型边界

- 这是产品体验原型，不连接真实大模型、语音 API、账号系统或生产数据库；
- 群聊回复与 AI 分析结果为预设内容，用于验证多角色接话、记忆治理和创作控制流程；
- 数据仅保存在当前浏览器中，不会上传到外部服务；
- 仓库未附开源许可证，代码与视觉素材仅用于作品集展示；如需引用或复用，请先联系作者。

## English Version

# Interlude | Interactive Prototype for an AI Character-Creation Platform

> Let characters continue living beyond the written page.

![Preview of Interlude's character-memory constellation](./public/og.png)

Interlude is a personal creative platform that I independently designed and implemented through vibecoding. It grew out of my long-standing interest in writing: I wanted fictional characters to exist beyond a static manuscript, continuing to interact inside an author-controlled system of world facts, memories, relationships, and behavioral rules—and returning useful new details to the writing process.

The current prototype validates one end-to-end product loop: **multi-character conversation → candidate-memory extraction → author review and editing → canon confirmation → Skill refinement and character rehearsal**.

## Product Design

| Area | Design |
| --- | --- |
| Target users | Original-fiction writers, fan-fiction creators, and interactive-storytelling creators |
| Core value | Sustained character interaction without knowledge leakage, timeline contamination, or AI-generated canon being accepted without author approval |
| Character system | Each character combines a profile, Prompt, explainable Skills, Memory, relationships, and voice settings |
| Conversation model | Supports solo chat, group chat, observation, and replay branches; characters respond to one another according to their personalities and available knowledge |
| Memory governance | AI-derived details remain candidates until the author edits the objective fact and character/reader perspectives, then explicitly confirms canon |
| Creative control | Skill editing and rehearsal, versioning concepts, a perspective matrix, timelines, and branch isolation |
| Experience language | A visual system inspired by film sets, writers' rooms, and continuity boards, with dark screening-room and light script-desk modes |

See [PRD.md](./PRD.md) for the complete product context, information architecture, key flows, conceptual data model, MVP scope, success metrics, and risk analysis.

## Implemented Prototype Capabilities

- A full-screen story library with multiple project entry points;
- Character group chat, quick prompts, and scripted multi-character turn-taking;
- Candidate-memory editing, a perspective matrix, and canon-confirmation flow;
- Story constellation, character spaces, Skill editing, and one-line rehearsal;
- Manuscript reading, AI scene-segmentation presentation, and dialogue rehearsal;
- Dark/light modes and responsive desktop/mobile layouts;
- Browser `localStorage` persistence for conversations, Memory, Skills, and reading state.

## Technical Implementation

| Category | Details |
| --- | --- |
| Front end | Next.js 16, React 19, TypeScript, CSS, and Lucide React |
| Build and runtime | Vinext, Vite, and a local Cloudflare Worker configuration |
| Data | No server-side database in the current prototype; interaction state is stored locally in the browser |
| Quality checks | ESLint, server-render validation, and tests for key product copy and required assets |

## Run Locally

Requires Node.js `>=22.13.0`.

```bash
git clone https://github.com/Peggy-H33/Portfolio.git
cd Portfolio/vibecoding/mujian-creative-writing-platform
npm ci
npm run dev
```

Open `http://localhost:3000/` in a browser.

Quality checks:

```bash
npm run lint
npm test
```

## Suggested Demo Flow

1. Open *Letters from Fog Harbor* from the story library and review the group conversation between Lin Zhi and Shen Yan;
2. Select “Review and archive” in the director panel;
3. Edit the objective fact and four perspectives, then confirm it as canon;
4. Return to the story constellation and open a character space;
5. Edit a character Skill and rehearse one line;
6. Refresh to verify local persistence, or use “Restore demo” to return to the initial state.

## Prototype Scope

- This is an experience prototype; it does not connect to a live LLM, speech API, account system, or production database;
- Group-chat replies and AI analysis are scripted to validate turn-taking, memory governance, and creative-control flows;
- Data stays in the current browser and is not uploaded to an external service;
- No open-source license is included. Code and visual assets are published for portfolio viewing only; please contact the author before reuse.

[返回 vibecoding 项目列表 / Back to vibecoding projects](../README.md)
