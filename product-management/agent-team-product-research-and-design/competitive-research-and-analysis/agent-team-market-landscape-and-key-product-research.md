---
title: Agent Team技术调研与研发参考
date: 2026-07-26
language: zh-CN
---

# Agent Team/Claw Chat Group技术和产品调研

> 调研参考文档 · 截至 2026-07-26
> By Peggy Han

本文从系统原理、运行时、调度拓扑、上下文隔离、通信、权限、成本与可观测性等维度，梳理 Claude Code、codex、Kimi、MiniMax Code、WorkBuddy等代表性竞品，覆盖市面上主流的已发布的Agent Team、Claw群聊等产品类型。

- **资料来源：** 官方文档优先+第三方补证
- **范围：** Agent Team类产品
- **覆盖：** 30 个市场条目、61 条来源条目

## 目录

- [01 · 总述](#summary)
- [02 · 原理与边界](#definition)
- [03 · 市场全景](#landscape)
- [04 · 四款重点产品技术对比](#comparison)
- [05 · Claude Code](#claude)
- [06 · Kimi Agent 集群](#kimi)
- [07 · MiniMax Code](#minimax)
- [08 · WorkBuddy](#workbuddy)
- [09 · Claw 群聊](#claw)
- [10 · 数据、成本与上限](#data)
- [11 · 工程实现要求与验收指标](#pm)
- [12 · 待研发核实的技术问题](#unknowns)
- [13 · 来源索引](#sources)
- [附录 A · Claude Code Agent Teams 官方全文](#appendix-claude-agent-teams)
- [附录 B · OpenAI Swarm 官方说明与概念校准](#appendix-openai-swarm)
- [附录 C · MiniMax Agent Team 官方文章摘要](#appendix-minimax-agent-team-summary)
- [附录 D · OpenAI Swarm、Claude 与 MiniMax 三者对比](#appendix-three-way-comparison)

<a id="summary"></a>

## 总述：Agent Team和Agent 群聊是两个产品形态，Agent Team也不只是简单调用子Agent

“主 Agent 接收任务，调用多个子 Agent 并行执行”是常见骨架，但不能据此把所有产品视为同一种实现。Codex 当前提供可由主线程触发的 Subagent workflow，并另有多线程 / worktree 控制台；Claude Code 同时提供轻量 Subagent 与需要显式开启的 Agent Teams；Kimi K3 Swarm 则是需要选择相应模型 / 模式的大规模横向并行产品。除此之外，市面上还有原生协作团队、人工监管的并行会话和持久化 Agent 群聊等产品形态，其目标、内部工作流和用户操作方式并不相同。


- **01 · 现在市场上至少有四种被混称为 “Agent Team” 的东西** — 原生协作团队（Claude / MiniMax / CodeBuddy）、自动批量 Swarm（Kimi / Manus/ codex）、人工监管的并行会话（Codex / Cursor / Devin），以及多主体群聊（Kimi Claw / Clawpond）。它们的目标、生命周期和上限口径完全不同。

- **02 · 公开上限非常不完整，且最容易被营销数字误导** — Kimi 托管 Swarm 宣称单任务峰值最多 300 个子 Agent / 4,000 次协调或工具调用；Claude 官方写明无硬上限但建议从 3–5 名开始；MiniMax 与 WorkBuddy 均未公布单队成员硬上限。WorkBuddy 的“100+ 专家”是目录，不是并发。
- **03 · 成本通常不是线性等于人数，但一定存在“协调税”** — Claude Code 官方仅给出 plan mode 场景约 7× 标准会话；WorkBuddy 官方称专家团通常为单专家 3–5×；Anthropic 研究系统约为普通聊天 15×。
- **04 · Claw 群聊广义上可以承载 Agent Team，但群聊本身不等于团队** — Kimi Claw 有 Conductor、Worker、Thread、共享 Workspace 与真人成员，已经是持久协作控制面；OpenClaw Broadcast 只是把同一消息并行发给多个隔离 Agent，彼此看不到回复，因此更像“多路广播”，不是协作团队。


<a id="definition"></a>


### 四种合作形态

| 形态 | 核心机制 | 用户看到什么 | 典型产品 | 能否称为 Team |
| --- | --- | --- | --- | --- |
| **一次性 Subagent** | 主 Agent 调工具，子 Agent 返回一次结果 | 通常只看主会话与摘要 | Claude subagents、Agents SDK tools | 通常不算；缺少持续协作 |
| **自动 Swarm** | 主 Agent 动态扩容，大量独立子任务并行 | 任务树、进度、来源、中间产物 | Kimi Swarm、Codex、Manus Wide Research | 广义算，重心是吞吐 |
| **原生 Agent Team** | 持久成员、共享任务、消息、依赖、验证循环 | 成员会话、任务表、状态、文件与干预入口 | Claude Code、MiniMax Code、CodeBuddy | 是，组织关系更完整 |
| **并行 Agent 控制台** | 用户同时管理多个隔离任务 / worktree | 多个线程、diff、分支、状态 | OpenAI Codex app、Cursor | 不一定；常由人类做 Lead |
| **Agent 群聊** | 真人与持久 Agent 共享空间、@、线程、权限 | 群消息、成员、Thread、Workspace | Kimi Claw、Clawpond、FloatIM | 可承载 Team；群聊 UI 本身不充分 |



### 用户组队 · 临时任务

- Claude Code
- MiniMax Code
- CodeBuddy
- Qwen Code
- CrewAI
- AutoGen

### 系统组队 · 临时任务

- Kimi Swarm
- Manus Wide Research
- Cursor /multitask
- Codex Symphony

### 用户组队 · 持久协作

- Kimi Claw
- Clawpond
- FloatIM
- AgentDM
- WorkBuddy 专家团

### 触发方式

| 产品 / 方案 | 层级 | 谁编队 | 核心形态 | 公开规模口径 | 用户可配 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| **Claude Code Agent Teams** | 原生 Team | 用户请求 / Claude 建议后确认 | Lead + 持久 teammate + 任务表 + mailbox | 无硬上限；建议 3–5 | 角色、名字、模型、任务、plan gate | [A01](https://code.claude.com/docs/en/agent-teams) |
| **Kimi Agent Swarm / K3 集群** | 自动 Swarm | 系统自动 | 动态拆解、大规模并行、主 Agent 汇总 | 峰值 300 子 Agent / 4,000 步 | Prompt 间接约束，消费端无 roster UI | [A07](https://www.kimi.com/zh-cn/help/agent/agent-swarm) |
| **Kimi Code CLI AgentSwarm** | CLI Swarm | 主 Agent / 用户命令 | 可配置 profile 的并行子 Agent | 单次最多 128；初始并发 5 | Markdown 配置模型、工具、下级 Agent | [A14](https://www.kimi.com/code/docs/kimi-code-cli/reference/tools.html) |
| **MiniMax Code Agent Team** | 原生 Team | 自动判断 + 用户手动配置 | Leader–Worker–Verifier + 状态机返工 | 未公布单队硬上限 | 角色、指令、工作区、Skills、频道 | [A17](https://www.minimax.io/blog/minimax-agent-team-long-running-1779893953) |
| **WorkBuddy 专家团** | 业务 Team | 用户选团，团长自动调度 | 行业专家 + 方法论 + 工作流 + 制品 | 未公布；100+ 是目录 | 预设团；自定义专家 / 团已出现 | [A21](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Expert-Center) |
| **CodeBuddy Agent Teams** | 原生 Team | 用户请求 / Lead | Lead、teammate、任务、消息、直聊 | 未公布 | 自然语言指定成员、任务、模型、plan | [A26](https://www.codebuddy.ai/docs/cli/agent-teams) |
| **Qwen Code Agent Team** | 实验 Team | 用户开启实验项 | 长期 teammate、共享任务、leader 综合 | 未公布 | 配置 experimental.agentTeam | [A27](https://qwenlm.github.io/qwen-code-docs/en/blog/updates/weekly-update-2026-06-18/) |
| **Manus Wide Research** | 批量 Swarm | 系统自动触发 | 按对象拆分独立 Agent，再统一汇总 | 文档称测试至 250；FAQ 曾称 20 并发 | 主要定义目标与对象列表 | [A28](https://manus.im/docs/features/wide-research) |
| **Cursor /multitask** | 并行 Fleet | 用户命令 + 系统拆分 | 异步 subagents、worktree / 多根目录 | 未公布 | 用户管理并行任务与 review | [A29](https://cursor.com/changelog/04-24-26) |
| **OpenAI Codex app** | 并行控制台 | 用户管理多个 task | 线程 / 项目 / worktree 隔离与 diff review | 未公布 | 高；人类通常是总调度 | [A30](https://openai.com/index/introducing-the-codex-app/) |
| **OpenAI Symphony** | 任务编排 | 控制面自动分配 | 任务板上每个可执行项对应独立 Agent | 案例称人类舒适管理 3–5 会话 | 任务系统、规则与验收 | [A31](https://openai.com/index/open-source-codex-orchestration-symphony/) |
| **Devin Managed Devins** | 托管 Team | 主 Devin 自动 / 用户要求，启动前审批 | 独立 VM 子会话、主会话监控、消息与汇总 | 当前文档称无并发 session 硬限制 | 子任务、playbook、tag、ACU 预算 | [A48](https://docs.devin.ai/work-with-devin/advanced-capabilities) |
| **GitHub Copilot Agent HQ** | 多 Agent 控制台 | 用户选择 / 分派多个 Agent | Copilot、Claude、Codex、自定义 Agent 的统一任务与 PR 控制面 | 未公布会话硬上限 | 供应商、任务、自定义 Agent、MCP 与组织策略 | [A49](https://github.com/features/copilot/agents) |
| **AWS Bedrock Multi-agent Collaboration** | 企业平台 | 开发者配置 supervisor | Supervisor + collaborators | 最多 10 collaborators | 角色、指令、路由与知识；Classic 2026-07-30 起不接新客户 | [A32](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent-collaboration.html) |
| **Microsoft Copilot Studio** | 企业平台 | 开发者连接 Agent | 主 Agent 自动选择连接 Agent / 工具 | 未见统一公开上限 | 图形化配置、描述、权限与 activity map | [A33](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-add-other-agents) |
| **Salesforce Agentforce** | 企业平台 | 管理员配置 Superagent | 面向 CRM / 业务流程的多 Agent 编排 | 未公布 | 角色、主题、动作、数据与治理 | [A34](https://www.salesforce.com/agentforce/multi-agent-orchestration/) |
| **Oracle AI Agent Studio** | 企业平台 | 业务管理员 / 开发者 | Agent Team，可选 Supervisor 或确定性 Workflow | 未公布 | 创建、调试、HITL、部署、嵌入 | [A35](https://docs.oracle.com/en/cloud/saas/fusion-ai/26b/aiaas/get-started.html) |
| **IBM watsonx Orchestrate** | 企业平台 | 开发者配置 | Primary + collaborators；可嵌套 | 未公布 | Agent、工具、流程与治理 | [A36](https://www.ibm.com/docs/en/watsonx/watson-orchestrate/base?topic=agents-orchestrating) |
| **Kimi Claw 群聊** | Agent 群聊 | 用户选成员，Kimi 调度 | 真人 + 异构 Claw + Conductor + Thread | 套餐可建 10 群；单群成员上限未公布 | 成员、群规则、@、可见性、设备与工具 | [A12](https://www.kimi.com/zh-cn/help/kimi-claw/kimiclaw-group-chat) |
| **OpenClaw Broadcast Groups** | 广播群 | 用户配置映射 | 同一消息 fan-out；各 Agent 隔离、不互看回复 | 无硬上限；官方称 10+ 会变慢 | Agent、路由、顺序 / 并行；当前 WhatsApp Web | [A44](https://docs.openclaw.ai/channels/broadcast-groups) |
| **Clawpond / 虾塘** | Agent 群聊 | 用户 @ 多个本地 Agent | 群 / Thread / task；Daemon 接入多种 CLI | 15+ runtimes；单群上限未公布 | Agent、角色、Thread、本地执行 | [A45](https://clawpond.org/) |
| **FloatIM** | Agent 消息网 | 用户 / 规则 | 真人与多 Agent 的规则、角色、权限群 | 未公布；早期产品 | 群组、身份、权限与本地执行 | [A46](https://floatboat.ai/blog/introducing-floatim) |
| **AgentDM / Teamfuse** | 协作层 | 开发者定义 | Agent-to-Agent 频道、DM、角色、记忆 | 未公布 | 高；更像开发框架 | [A47](https://agentdm.ai/) |
| **OpenAI Agents SDK** | 框架 | 开发者 / Manager Agent | Agents-as-tools、handoff、代码编排、并行 | 由应用决定 | 极高 | [A37](https://openai.github.io/openai-agents-python/multi_agent/) |
| **Microsoft AutoGen** | 框架 | 开发者定义 | RoundRobin、Selector、Magentic-One、Swarm | 由应用决定 | 极高 | [A38](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/teams.html) |
| **CrewAI** | 框架 | 开发者定义 | 角色、Tasks、Crews 与确定性 Flows | 由应用决定 | 极高 | [A39](https://docs.crewai.com/) |
| **LangGraph** | 框架 | 开发者定义图 | 状态图、supervisor、handoff、持久化与 HITL | 由应用决定 | 极高 | [A40](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/multi-agent-collaboration/) |
| **Google ADK** | 框架 | 开发者定义 | LLM Agent + Sequential / Parallel / Loop workflow | 由应用决定 | 极高 | [A41](https://google.github.io/adk-docs/agents/multi-agents/) |
| **MetaGPT** | 框架 | 开发者 / SOP | PM、架构师、工程师等软件公司角色 | 由配置决定 | 高 | [A42](https://docs.deepwisdom.ai/main/en/guide/get_started/introduction.html) |
| **CAMEL Workforce** | 框架 | 开发者 / 协调器 | 可扩展 workforce、worker 与任务调度 | 由配置决定 | 高 | [A43](https://docs.camel-ai.org/key_modules/workforce) |

**覆盖说明：** 表中列的是“公开可核验的代表性版图”，不是声称收尽每个 GitHub 实验仓库或企业私有实现。Moltbook 一类 Agent 社交网络被排除在主比较之外：它们证明“Agent 可以共享社会空间”，但不以共同目标、任务图和统一交付为核心。

<a id="comparison"></a>

## 四款重点产品：技术与用户流程对比

这张表只比较同类问题，不把产品总目录、账号配额、创建数、运行子任务数和架构峰值混成“最大 Agent 数”。“透明度”指可观察的执行面，不等于公开模型思维链。

| 维度 | Claude Code Agent Teams | Kimi Agent Swarm / K3 | MiniMax Code Agent Team | WorkBuddy 专家团 |
| --- | --- | --- | --- | --- |
| **产品范式** | 开发者可观察的终端协作团队 | 消费端自动横向扩容 | 长任务自主项目团队 | 业务角色与办公流程产品化 |
| **谁发起组队** | 用户明确要求；或 Claude 建议、用户确认 | 系统根据任务自动决定 | 系统自动判断；也可用户建角色 / 团队 | 用户从专家中心召唤团队 |
| **用户能否编队** | 能：人数、名字、角色、模型、任务、文件边界 | 消费端只能用 Prompt 间接约束 | 能：角色、指令、工作区、技能、频道 | 预设团成熟；自定义专家 / 专家团已出现，教程仍不完整 |
| **是否需开关 / 特殊模式** | 实验变量开启；无独立 GUI 编队窗 | 进入 Agent Swarm / App 选 K3 集群；后续自动路由 | 无需独立 Team 模式；给目标即可，也有 Team 配置区 | 从“专家中心”召唤；不是 Ask / Craft / Plan 的第四模式 |
| **成员上下文** | 每人独立 session / context；继承项目配置但不继承 Lead 聊天史 | 子 Agent 局部隔离上下文，仅回传必要信息 | 角色隔离上下文、工具、记忆与输出协议 | 子会话 / 子 Agent；公开技术细节较少 |
| **通信与状态** | 共享任务表、依赖、P2P mailbox、用户直聊 | 主要由 Orchestrator 分发与汇总；用户看进度 | 多轮消息、共享白板 / 文件 / CLI、Team Engine 状态 | 队列、子 Agent 卡片、制品汇总；P2P 拓扑未统一披露 |
| **质量门** | plan approval、hooks、测试；无固定 verifier 角色 | 主 Agent 聚合与校验；细节闭源 | 原生 Verifier，对抗式验收，失败唤醒 Worker 返工 | 团长汇总；部分模板有阶段和验收规则 |
| **用户中途干预** | 可切入每个 teammate、发消息、中断、停止 | 可看过程与追加要求；不能稳定点名临时 Agent | 可看成员 session、追加要求、批准 / 终止 | 可看成员卡、状态、工具与制品并继续追问 |
| **透明度判断** | 中高 控制面清楚，调度判断仍黑箱 | 中 过程可见、策略黑箱 | 中 架构披露深，内核闭源 | 中 UI 可见，模板 / 调度闭源 |
| **单队 / 单任务上限** | 官方无硬上限；建议 3–5 起步 | 架构峰值最多 300 / 4,000 步；套餐实际资源另限 | 未公布 | 未公布 |
| **成本公开口径** | plan mode 场景约 7× 标准 session | “数倍额度”；无统一倍率 | 无产品实测倍率 | 通常为单专家 3–5× 积分 |
| **会员 / 可用性** | 实验功能；官方未列独立套餐门槛，受 Claude Code 权益与组织政策限制 | 当前中国套餐 Moderato 起；套餐表有 2 / 4 / 8 “运行子任务数”口径 | 付费 Token Plan 覆盖 Code；Team 专属免费权益未明 | 积分制；价格表未单列专家团会员门槛 |
| **最大产品风险** | 共享 checkout 同文件冲突、成本、无法嵌套 / 转移 Lead | “300”与用户实际并发不透明、失败项容易被总结果掩盖 | 验证循环拖慢并放大成本、预算 / 重试阈值不透明 | 模板化强、团队通信机制与硬上限不透明、仍在密集修稳定性 |


<a id="claude"></a>

## Claude Code Agent Teams

*Anthropic · Experimental*

最接近“开发者坐在指挥台上，能看见、切入并纠偏每位队友”的产品；不是一次性 subagent，而是多个持久 Claude Code session。

**规模提示：** **3–5** 是官方建议的起步团队规模，不是上限。

**用户流程：** 开启实验变量 → 自然语言要求组队 → Lead 隐式建队 → 共享任务 / 自领 → P2P 协作 → Lead 综合

- **开启方式：** 在 settings / 环境中启用 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`。自 v2.1.178 起，首次 spawn teammate 会为当前 session 隐式成团；旧文章里的 TeamCreate / TeamDelete 已过时。[A01](https://code.claude.com/docs/en/agent-teams)
- **编队方式：** 用户可直接说“创建 4 人团队”，指定成员名字、角色、模型、任务边界、文件所有权和 plan 审批条件；Claude 也可建议组队，但官方说明不会在未获批准时自行 spawn。
- **运行时：** Lead、多个 teammate、共享 task list 与 mailbox。每名 teammate 是独立会话 / 上下文，可互相直接发消息，也能自领未分配任务；依赖完成后自动解锁。
- **上下文与权限：** teammate 获得 CLAUDE.md、项目 / 用户级 Skills 与 MCP、spawn prompt，但不继承 Lead 的聊天历史。权限在 spawn 时继承 Lead，不能一开始逐人设置；权限请求上浮给用户。
- **用户操作：** 默认 in-process panel；也可在 tmux / iTerm2 分屏。用户可选择某位 teammate、直接发消息、打断、停止；Ctrl+T 查看任务。VS Code integrated terminal 等不支持 split panes，但可用 panel。
- **本地状态：** 团队 inbox 位于 `~/.claude/teams/…`，任务在 `~/.claude/tasks/…`。团队配置随 session 结束清理，任务记录按清理策略保留；不建议手改。

#### 真正的差异

普通 subagent 主要 caller↔worker、一次结果返回；teammate 长驻、可 P2P、共享任务、用户可直接 steer。

#### 透明但非白盒

任务表、session transcript、消息、idle、hooks、本地状态可见；Lead 为什么这样拆、何时停止仍由模型判断。

#### 最大工程风险

成员共享同一 checkout，不自动建 worktree。必须明确文件 ownership，否则同文件修改可能互相覆盖。

### 公开限制

一 session 只能一个 team；不能 nested team；Lead 不可转移；in-process teammate 的 resume / rewind 有限制；任务状态偶尔滞后；shutdown 可能慢；split pane 受终端限制；spawn 时不能逐成员设权限。hooks（TeammateIdle / TaskCreated / TaskCompleted）可做质量门。[A01](https://code.claude.com/docs/en/agent-teams)

### 成本、套餐与数据

官方成本页的唯一明确团队倍率是：当 teammates 在 plan mode 运行时，Agent Teams 约消耗标准 session 的 **7× token**；实际随人数、时长和模型变化。官方没有给硬性 teammate 上限。Agent Teams 页面没有单列套餐门槛，因此只能谨慎表述为“可用性取决于 Claude Code 权益、实验开关与组织策略”，不能写成 Max 独享。[A02](https://code.claude.com/docs/en/costs) [A03](https://code.claude.com/docs/en/feature-availability)

Anthropic 曾用早期自建并行 harness 让 16 个 Agent、近 2,000 个 session、约 2B input + 140M output token，在两周内生成约 10 万行 Rust C 编译器，成本略低于 2 万美元。它没有当前内置团队的 Agent 间通信 / orchestrator，**不能把 16 当成产品上限**。[A06](https://www.anthropic.com/engineering/building-c-compiler)

<a id="kimi"></a>

## Kimi Agent Swarm

*Kimi · K3*

全自动化产品：用户给目标，系统决定是否并行、拆成什么、需要多少子 Agent。它更像按任务弹性扩容的计算集群，而不是用户先组一支固定队伍。

**规模提示：** **300** 是官方架构峰值，不等于每个会员实际并发。

**用户流程：** 进入网页端 / 选 K3集群模式 → 描述最终目标 → Orchestrator 动态拆解 → 子 Agent 并行 → 实时进度 / 来源 → 主 Agent 汇总

### 原理：训练协调者，而不是硬编码角色

Kimi 把核心称为 PARL（Parallel-Agent Reinforcement Learning）：冻结子 Agent，训练 Orchestrator 真正做并行分工，奖励任务完成与有效并行。子 Agent 使用隔离的局部上下文，只回传必要结论，减轻主上下文污染。官方强调无需预定义角色、无需用户搭工作流。[A08](https://www.kimi.com/blog/agent-swarm) [A09](https://arxiv.org/abs/2602.02276)

#### 用户操作流程

1. 打开kimi选择K3集群模式
2. 写清目标、输入文件、分组维度、输出格式和验收标准。
3. 系统自动决定子任务、Agent 数量、工具和并行度。
4. 用户查看任务清单、生成中的 Agent、进度、工具、网页和中间代码。
5. 主 Agent 汇总为网页、代码、数据、文档、PPT 等。
6. 后续追问由 Kimi 自动在聊天与 Agent 任务间路由。

#### 用户能控制什么

**能：** 在 Prompt 中要求按行业、地区、文件、观点或角色分工，提出 Agent 数量偏好与验收标准。

**不能稳定控制：** 消费端没有逐个命名、选模型、配工具 / 权限的 roster UI；最终创建数与实际同时活跃数由调度器决定。

如果需要强自定义，Kimi Code CLI 的 AgentSwarm 才是对应形态：最多 128 子 Agent、可用 Markdown 定义 profile、模型、工具与下级 Agent。[A16](https://www.kimi.com/code/docs/kimi-code-cli/customization/agents.html)

### “300 个”到底是什么意思

K2.6 官方把架构能力扩展到最多 300 个子 Agent、4,000 次协调步骤 / 工具调用；这代表峰值能力，不是所有任务必然创建 300 个，也不是订阅用户的保证并发。最新中国套餐表又列出 Moderato / Allegretto / Allegro 的“集群运行子任务数”分别为 2 / 4 / 8，官方未解释它与 300 的精确映射。最严谨的写法是：**架构峰值 300；实际并行受套餐、任务、资源和调度器共同限制。** [A08](https://www.kimi.com/blog/kimi-k2-6) [A10](https://www.kimi.com/zh-cn/resources/kimi-k3-pricing)

### 透明度：过程可视，策略黑箱

#### 可见

子任务、Agent 名称 / 分工、执行状态、工具调用、来源 URL、部分中间产物与最终文件。

#### 不可见

为什么创建这个数量、真实调度策略、逐 Agent token、失败重试与模型路由的完整逻辑。开源 K2.5 论文 / 权重不等于托管 Swarm 产品开源。

### 厂商自测与第三方观察

**K2.5 论文：单 Agent vs Swarm**

厂商自测，不是独立横评。[A09](https://arxiv.org/abs/2602.02276)

- BrowseComp · 单：**60.6**
- BrowseComp · 群：**78.4**
- WideSearch · 单：**72.7**
- WideSearch · 群：**79.0**
- 内部 Bench · 单：**41.6**
- 内部 Bench · 群：**58.3**

论文还报告特定并行任务关键路径约 3–4.5× 加速、端到端时间最多降低约 80%，但不能外推到强依赖任务。DataCamp 的早期 K2.5 实测中，请求至少 20 个 Agent，系统创建 25 个但约 5 个同时活跃；Bubble Shooter 强依赖任务只用了 1 个子 Agent，说明“创建数、活跃并发、官方上限”是三种数字。[B48](https://www.datacamp.com/tutorial/kimi-k2-agent-swarm-guide)

<a id="minimax"></a>

## MiniMax Code Agent Team

*MiniMax · Mavis / MiniMax Code*

不是只有“并行”，而是把生产、验证、失败返工做成状态机。四款中对运行时结构披露最深，但调度内核仍闭源。

**角色结构：** **L–W–V**，即 Leader · Worker · Verifier。

**用户流程：** 用户给目标 → 判断单干 / 组队 → Leader 建任务图 → Worker 执行 → Verifier 验收 → 失败返工

### 内部工作流

#### Leader · 控制面

判断任务是否值得组队、拆解粒度、依赖、重试、何时升级给人类，并持续接收 Team Engine 状态。

#### Worker · 专业执行

不同 Worker 可有不同工具、上下文、记忆、Skills、输出协议和验收要求，分别调研、编码或制作文件。

#### Verifier · 对抗验收

检查来源、覆盖、测试、风险；验证失败后 Team Engine 让 producing 节点重新工作，而不是把“做完”当“可交付”。

官方把每个 Agent 的生命周期做成 `producing → verifying → done` 的确定性状态机。跨 Agent 通过交接文件、路径 + 摘要、共享白板、记忆与通信 CLI 传递信息；用户在长任务进行中仍可和主 Agent 对话、追加工作，系统按 checkpoint 主动汇报。[A17](https://www.minimax.io/blog/minimax-agent-team-long-running-1779893953)

### 用户操作：自动路由与手动配置并存

#### 自动路径

新建 Task → 选择 Workspace / 文件 / Skills → 输入最终目标 → Mavis 判断简单任务单 Agent、复杂任务组队 → 查看成员 Session 与进度 → 中途补充、批准权限或终止 → Verifier 验收与返工 → Leader 交付。

#### 手动路径

在 Agent Team 区创建角色，配置名称、头像、职责、系统指令、默认工作区、Skills 与 IM 频道，再组成团队。无需先切一个“Agent Team 模式”；Coding / Work 是界面侧重，不是是否组队的总开关。[A18](https://agent.minimax.io/docs/code/agents/team) [A19](https://agent.minimax.io/docs/code/agents/custom-agents)

### 成本与会员：不要把套餐“Agent usage”当团队人数上限

国际 Token Plan 当前为 Plus $20 / Max $50 / Ultra $120，文档给出 “Agent usage 3–4 / 4–5 / 6–7 agents” 的用量引导，并采用 5 小时滚动与周窗口；它没有定义为单个 Agent Team 的硬成员上限。官方博客明确承认 handoff、sharing、aggregation 三类协调成本和更长交付时间，但没有给 MiniMax Team 相对单 Agent 的受控倍率。[A20](https://platform.minimax.io/docs/guides/pricing-token-plan)

博客引用的 2.1–3.4× token 来自外部 multi-agent consensus 研究，不是 MiniMax 自身产品测量。MiniMax 公布的 SWE-Bench、Terminal Bench 等数据是模型 / harness 指标，也不是 Team vs 单 Agent 的 A/B。

### 黑箱判断

**中等透明：**角色、状态机、返工、交接、成员 session 与进度公开；组队阈值、成员打分、prompt 模板、默认重试上限、预算熔断和模型分配未公开。官方曾表示计划开源 MiniMax Code，但当前公开仓库并非完整实现。

<a id="workbuddy"></a>

## WorkBuddy 专家团

*Tencent · Office Agent Workspace*

把“多 Agent 组织”包装成普通职场用户能理解的专家卡、团队卡和交付流程。技术内核披露较少，但业务角色与行业方法论最产品化。

**成本提示：** 官方称通常为单专家的 **3–5×** 积分消耗。

**用户流程：** 打开专家中心 → 浏览 / 召唤专家团 → 描述任务 → 团长拆解 → 专家并行 → 统一制品

### 产品逻辑：Skill、专家、专家团是三层

#### Skill

让 AI “能做某件事”的工具能力，例如 PPT、数据报表、海报、连接器或 MCP。

#### 专家

人设 + 方法论 + 工具链，形成某一领域的单个 AI 顾问。

#### 专家团

多位专家 + 协作流程；团长自动拆解、并行执行、汇总并交付完整制品。[A21](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Expert-Center)

### 模式与用户入口

WorkBuddy 普通任务有 Ask（只读回答）、Craft（直接执行 / 改文件）、Plan（先计划、确认后执行）三种权限 / 交互模式；专家团不是第四种模式。标准路径是用户先在左侧“专家”中召唤某个团队，再由团长自动调度。官方没有承诺任何普通聊天都会自动升级为专家团。[A22](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Task-Bar)

- **用户可见性：** 子 Agent 卡片 / 查看页、团队队列、任务状态、工具调用、成员制品汇总、文件预览与权限请求。更新日志证明这些面板持续迭代。[A24](https://www.workbuddy.cn/docs/workbuddy/Changelog)
- **自定义：** “我的专家”可创建 / 编辑自定义专家，配置方法论、Skill 与 MCP；更新日志已出现“自定义专家团 Lead”和成员映射，说明自定义团存在，但个人端完整 UI 教程与成员上限仍未公开。
- **企业层：** 企业智能体可用 Manifest 配置身份、模型、系统提示、Skill、Expert、MCP、记忆、知识库、工作区与 `subagents`，但它与个人专家团是否共用同一运行时，官方未说明。[A25](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/CloudAgent)
- **通信拓扑：** 官方可确认团长拆解、分配、并行、汇总；第三方对不同模板的分析在“成员是否 P2P”上不一致，应标为未知，而不是凭一份逆向 prompt 外推全产品。

### 成本、套餐与成熟度

官方明确专家团通常消耗单专家 **3–5×** 积分。2026-07-01 起个人版为体验版免费 500 积分、标准 ¥99 / 月、高级 ¥199 / 月、旗舰 ¥999 / 月；当前有连续包月折扣与限时赠送。价格表未把“专家团”单列为某档权益，因此不能据此断言所有免费用户都能使用所有团队。[A23](https://www.workbuddy.cn/docs/workbuddy/Pricing)

更新日志是一份难得的成熟度证据：2026 年仍密集修复多子任务并发失控、子 Agent 注册失败、任务提前终止、长输出截断、队列残留、权限继承、上下文压缩、历史恢复与沙箱审批等问题。结论不是“不可用”，而是该能力已产品化但仍处快速打磨期。[A24](https://www.workbuddy.cn/docs/workbuddy/Changelog)

**口径纠错：** 官网“100+ 专家”是专家市场的可选角色数量；套餐里的“个人助理数”和“项目成员数”也都不是专家团并发 / 成员上限。官方没有公开单个专家团最多多少 Agent。

<a id="claw"></a>

## Claw 群聊：从“算力集群”转向“AI 原生组织空间”

Kimi 同时推出 Swarm 与 Claw 群聊，是因为它们解决两个不同问题：前者优化一件大任务如何更快铺开；后者优化一支由真人、云端 Agent、本地 Agent 与手机 Agent 组成的长期团队如何持续协作。

> **Kimi Agent Swarm 是计算层的自动扩容；Claw 群聊是组织层的多主体协作。两者共享“协调者拆解并分派”的思想，但编队权、生命周期、权限边界和用户交互完全不同。**

| 维度 | Kimi Agent Swarm | Kimi Claw 群聊 | 普通 Bot 群 / Broadcast |
| --- | --- | --- | --- |
| **目标** | 提高单次复杂任务吞吐 | 长期、多用户、多设备协作 | 让多个 Bot 分别响应 |
| **谁组队** | 系统临时创建 | 用户选择成员，Kimi 做 Conductor | 用户添加 Bot / 配路由 |
| **成员** | 同构临时子 Agent 为主 | KimiClaw、OpenClaw、Android Claw、真人 | 通常是互相独立的 Bot |
| **生命周期** | 随任务结束 | 群、规则、成员、记忆长期存在 | 群长期存在，工作状态未必存在 |
| **任务结构** | Orchestrator 的临时任务图 | Conductor 创建独立 Thread，隔离子任务上下文 | 常无任务图 / 统一验收 |
| **用户控制** | 主要给目标，不能稳定点名临时 Agent | 可 @ 单个 / 多个 / @Kimi，设群规则、成员、可见性 | 可 @，但多为消息级路由 |
| **共享制品** | 任务产物汇总 | 群聊 + Thread + 共享 Workspace | 附件 / 消息为主 |
| **是否是真 Team** | 任务型 Team / Swarm | 是可承载 Team 的协作控制面 | 不一定；可能只是并行回复 |

### Kimi Claw 的用户流程

**流程：**

- **1 · 准备 Claw** — KimiClaw、OpenClaw、桌面或 Android
- **2 · 创建群** — 填写名称与 Group Goal
- **3 · 选成员** — 邀请 Claw、真人，成员也可带自己的 Claw
- **4 · Conductor** — Kimi 自动成为协调者
- **5 · @ 与派单** — 不 @ 自动路由；@单个或多个显式指定
- **6 · Threads** — 每个子任务独立上下文，减少主群污染
- **7 · Workspace** — 汇总文件、预览、下载、继续协作

群主可设群目标、自然语言群规则、角色 / 输出格式、成员发言与内部 / 公开只读可见性；Kimi Conductor 不能被替换，调度与失败接管策略仍属黑箱。当前仍是 Preview / Beta。最新套餐口径显示 Allegretto、Allegro 可用，并可创建 10 个 Claw 群；官方没有公布单群最多 Agent / 真人数。[A12](https://www.kimi.com/zh-cn/help/kimi-claw/kimiclaw-group-chat) [A13](https://www.kimi.com/zh-cn/help/kimi-claw/overview)

### 还有谁做过类似的 Agent 群聊？

#### OpenClaw Broadcast Groups

一条符合条件的消息并行或顺序分发给多个 Agent；每个 Agent 拥有独立 session、workspace、工具和记忆，失败互不影响。关键差别：**Agent 看不到彼此回复**，因此没有 Conductor、P2P 协作或统一交付，更像多路广播。当前官方文档指向 WhatsApp Web。[A44](https://docs.openclaw.ai/channels/broadcast-groups)

#### Clawpond / 虾塘

把 Claude、Codex、Gemini、Kimi、Qwen 等本地 CLI Agent 拉进同一群 / Thread，以 @ 触发任务；Daemon 自动发现运行时，Server 通过 WebSocket 协调，强调本地数据。它是独立的 Agent-native 协作产品，不等于模型厂商内建 orchestration。[A45](https://clawpond.org/)

#### FloatIM

定位为 Agent-native messaging network，支持真人与多 Agent 的群、角色、规则与权限，提出“自组织团队”。截至研究日公开材料仍偏早期产品介绍，规模、稳定性与详细操作证据有限。[A46](https://floatboat.ai/blog/introducing-floatim)

#### AgentDM / Teamfuse

开源 / 开发者导向的 Agent-to-Agent channel 与 DM，提供角色、记忆、范围化工具和一键 bootstrap。更像把“Slack 协议层”提供给 Agent，而不是成熟消费端群聊。[A47](https://agentdm.ai/)

### 技术判断

Claw 群聊的壁垒不在“多个机器人能发消息”，而在成员身份 / 能力发现、权限和数据边界、Thread 上下文隔离、任务路由、失败检测与接管、共享文件生命周期、人类审批及责任归属。群聊可以成为 Agent Team 的控制面，但若没有任务状态、协调与验收，它仍只是多 Bot 聊天室。

**第三方早期个案：** APPSO 曾测试 1 名人类、Kimi 协调者和 6 个 Claw 的 8 成员群，接入了 MiniMax 等外部 OpenClaw；过程中出现网络失败和角色漂移，Kimi 有过接管与纠正。它证明异构接入可行，也同时说明 Preview 阶段的角色稳定性与失败恢复仍需观察。[B57](https://finance.sina.com.cn/tech/roll/2026-04-21/doc-inhvhrra4878541.shtml)

<a id="data"></a>

## 公开数据怎么读：先看分母，再看数字

当前最常见的误导，是把“单任务创建数、瞬时活跃并发、套餐可运行子任务数、账号同时任务数、产品目录数、工具调用数”都写成“最多能调用多少子 Agent”。下面只保留可解释口径。

| 产品 / 研究 | 公开数字 | 准确含义 | 不能推出什么 | 证据 |
| --- | --- | --- | --- | --- |
| **Claude Code Teams** | 无硬上限；建议 3–5 名、每人约 5–6 个任务起步 | 官方使用建议 | 不能据此写“最多 5 个” | [A01](https://code.claude.com/docs/en/agent-teams) |
| **Kimi K2.6 Swarm** | 最多 300 子 Agent / 4,000 步 | 托管架构或单任务峰值能力 | 不保证任意会员真实同时活跃 300 | [A08](https://www.kimi.com/blog/kimi-k2-6) |
| **Kimi 套餐** | 2 / 4 / 8 “集群运行子任务数” | 套餐资源口径 | 与 300 的映射未披露，不能强行等同 | [A10](https://www.kimi.com/zh-cn/resources/kimi-k3-pricing) |
| **Kimi Code CLI** | 单次最多 128；初始并发 5，逐步升高 | 开发者 CLI AgentSwarm 上限 / 调度行为 | 不是 Kimi.com 消费端 Swarm 上限 | [A14](https://www.kimi.com/code/docs/kimi-code-cli/reference/tools.html) |
| **MiniMax Token Plan** | 3–4 / 4–5 / 6–7 “Agent usage” | 套餐用量引导 / 并发资源参考 | 不是单个 MiniMax Team 成员硬上限 | [A20](https://platform.minimax.io/docs/guides/pricing-token-plan) |
| **WorkBuddy** | 100+ 专家 | 专家市场角色目录 | 不是单次调用 100+ Agent | [A21](https://www.workbuddy.cn/work/) |
| **AWS Bedrock** | 最多 10 collaborators | 平台配置限制 | 不代表所有企业编排平台通用上限 | [A32](https://docs.aws.amazon.com/bedrock/latest/userguide/create-multi-agent-collaboration.html) |
| **Manus Wide Research** | 文档称测试至 250 items；FAQ 曾称 20 simultaneous subtasks | 对象规模与并发是两个口径，且文档可能跨版本 | 不能直接写“并发 250” | [A28](https://manus.im/docs/features/wide-research) |

### Token / 积分倍数：三个数字，三个基线

#### Claude Code：≈ 7×

Agent Teams 的 teammates 在 plan mode 场景，相对标准 session。不是固定费率。[A02](https://code.claude.com/docs/en/costs)

#### WorkBuddy：3–5×

专家团相对单专家的通常积分消耗，以实际任务为准。[A21](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Expert-Center)

#### Anthropic Research：≈ 15×

多 Agent Research 系统相对普通聊天；不是 Claude Code Teams 的产品费率。[A05](https://www.anthropic.com/engineering/multi-agent-research-system)

**严禁直接排名：** 7×、3–5×、15× 的分母分别是标准 coding session、单专家积分、普通聊天。它们说明“协调昂贵”，但不能证明谁最省 token。

### 什么时候多 Agent 有效？现有研究给了清晰边界

#### 正向证据

Anthropic 的内部 research eval 中，Opus 4 lead + Sonnet 4 subagents 比单一 Opus 4 高 90.2%；其分析认为 token 使用解释了约 80% 的性能方差。它说明并行搜索广度有价值，也说明改进往往是“花更多计算买覆盖”。[A05](https://www.anthropic.com/engineering/multi-agent-research-system)

#### 反向证据

Google 对 180 个配置的研究中，中心化多 Agent 在可并行 Finance-Agent 上最高提升 80.9%，但所有多 Agent 架构在强顺序 PlanCraft 上下降 39%–70%；独立 Agent 的错误放大最高 17.2×，中心化管理降至 4.4×。[A55](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)

### 为什么目前不能做严肃的跨厂商排行榜

- 模型、任务、工具权限、搜索环境、上下文与预算不同。
- 厂商常展示“最好一次”或内部 benchmark，失败率与人工介入未披露。
- “更快”可能指关键路径，不是总 wall-clock；“更多 Agent”也可能只是排队创建。
- 质量常由厂商自己的 evaluator 判断，缺少盲评和相同验收标准。
- 套餐 / 调度快速变化，旧文章的开关、价格和上限容易过时。

比较产品时应要求同一任务集、同一底模或能力档、同一最大预算，至少公开：成功率、完成时间 P50/P95、token / 积分、工具调用、人工介入、子任务失败 / 遗漏、重做次数、最终验收通过率。

### 第三方个案数据：可观察趋势，不能当统一 Benchmark

| 产品 / 测试 | 观察到的数据 | 能说明什么 | 为什么不能外推 |
| --- | --- | --- | --- |
| **Claude Code · 单次 PR review** | 单 Opus：1–2 分钟 / 8 findings；Lead + 3 Opus：5分30秒 / 14；Lead + 3 Sonnet：3分50秒 / 11 | 多视角可能找到更多问题，但耗时和成本上升 | 仅 1 个小 PR、旧版 v2.1.38、非盲评 [B51](https://spectacle.world/contents/claude-code-agent-teams-setup-and-review-comparison/) |
| **Kimi K2.5 · 100 道题** | 请求 ≥20 Agent，创建 25，约 5 个同时活跃；耗时约 20–25 分钟 | 创建数、活跃并发、排队数应分别展示 | 早期 K2.5，任务与当前 K3 / 套餐不同 [B48](https://www.datacamp.com/tutorial/kimi-k2-agent-swarm-guide) |
| **MiniMax Mavis · HTML 任务** | 第三方观察为 3 个 Worker + Verifier，约 28 分钟交付交互 HTML | 验证角色与长任务后台执行是可见产品特征 | 单次演示、无单 Agent 对照与 token 记录 [B54](https://zhuanlan.zhihu.com/p/2038334895634772430) |
| **WorkBuddy · 4 专家案例** | 作者自报约 5–10 分钟、50–100 Credits | 专家团存在可感知的时间 / 积分成本 | 社区个案、任务与模型不受控，不可作为计费标准 [C58](https://developer.cloud.tencent.com/article/2710736) |

<a id="pm"></a>

## 工程实现要求与验收指标

本节将市场调研结论转换为研发侧可实现、可测试、可审计的系统要求。具体阈值应结合模型能力、部署资源、任务类型与业务 SLO 单独配置，不直接照搬竞品的 Agent 数量或套餐口径。

### 运行时最小闭环

| 模块 | 最低工程要求 | 建议验收方式 |
| --- | --- | --- |
| **复杂度与路由** | 在单 Agent、脚本、并行子任务和完整 Team 之间选择；支持用户强制覆盖自动判断 | 固定任务集重复运行，记录路由理由、最终路径与人工覆盖结果 |
| **任务图与调度** | 任务具备唯一 ID、依赖、负责人、状态、优先级、验收条件；任务认领和状态更新需原子化、幂等 | 并发认领、依赖解锁、重复事件、乱序回调和调度器重启测试 |
| **Agent 生命周期** | 至少覆盖 queued、running、blocked、verifying、retrying、completed、failed、cancelled；终态不可被迟到事件回写 | 故障注入后验证状态收敛、超时回收、取消传播与断点恢复 |
| **上下文隔离** | 每个 Agent 使用独立上下文；handoff 仅传结构化摘要、制品引用、约束与未决问题 | 检查跨 Agent 信息泄漏、上下文污染、截断后约束保留率 |
| **通信总线** | 支持定向消息、广播或经 Lead 中转；消息包含 sender、recipient、task ID、timestamp、dedupe key | 重复投递、乱序、超时、重试、离线成员和大消息降级测试 |
| **工作区与制品** | 代码任务使用 worktree / branch / sandbox 或明确文件所有权；制品必须版本化并记录来源 | 同文件并发写入、合并冲突、回滚、失败清理和制品完整性测试 |
| **工具与权限** | 工具权限按 Agent 最小化配置；敏感写入、外部发送和高风险命令具备审批点 | 越权调用、审批绕过、权限继承、提示注入与凭证泄漏测试 |
| **预算与背压** | 可限制团队规模、活跃并发、token、工具调用、运行时间、重试次数；超限时降级或熔断 | 达到各类预算上限时验证停止、降级、排队与告警行为 |
| **验证与返工** | Verifier / Reviewer 与生产节点解耦；验收基于测试、引用、schema、覆盖清单等外部证据 | 构造错误结果，验证拒绝、定向返工、最大重试和人工升级 |
| **人工干预** | 支持暂停、恢复、补充约束、改派、重试、取消、终止与必要的回滚 | 在各生命周期状态注入人工操作，验证无重复执行和孤儿任务 |
| **记忆与留存** | 区分会话状态、项目记忆、团队规则与长期偏好；具备来源、版本、过期和删除机制 | 错误记忆纠正、成员移除、数据过期和跨项目隔离测试 |
| **可观测性** | 每次运行具备 trace ID；记录状态转换、模型与工具耗时、逐 Agent 成本、失败与人工操作 | 能从事件日志重建完整执行时间线，并定位关键路径与失败根因 |

### 编排模式的接口边界

| 模式 | 输入与编队 | 运行时要求 | 共同约束 |
| --- | --- | --- | --- |
| **自动编队（Auto Team）** | 输入总目标，由复杂度闸门决定是否组队、成员数量、角色和任务图 | 必须输出可解释的编队结果；用户可覆盖成员、预算和停止条件 | 不得绕过权限、预算、审计、验收与人工中止机制 |
| **指定编队（Directed Team）** | 输入 team manifest 或成员配置，包含角色、模型、工具、权限和责任边界 | manifest 需要 schema 校验、版本管理和兼容性检查 | 调度器仍需处理冲突、失败、依赖、背压与统一交付 |

### 工程验收指标

| 维度 | 指标 | 验收关注点 |
| --- | --- | --- |
| **任务结果** | Verified Task Success @ Budget | 在固定预算内通过独立验收；不得仅依赖主 Agent 自评 |
| **完整性** | 子任务覆盖率、未完成显式率、验收项覆盖率 | 所有任务必须进入可解释终态；缺项不得被汇总结果掩盖 |
| **时延** | Time to First Acknowledgement、Time to Verified Output、P50 / P95 | 区分排队、模型推理、工具执行、验证返工与聚合耗时 |
| **并发效率** | 活跃 Agent 数、排队长度、关键路径、并发利用率 | 区分“创建数量”与“真实同时执行数量” |
| **经济性** | 总 token、逐 Agent token、工具成本、单位合格制品成本 | 成本可归因到任务、Agent、阶段与重试 |
| **可靠性** | 重试成功率、恢复成功率、重复执行率、孤儿任务数 | 调度器或 Worker 崩溃后可恢复，且副作用保持幂等 |
| **协作质量** | 重复劳动率、handoff 压缩率、冲突与回滚率 | 控制共享上下文广播税与多 Agent 写冲突 |
| **人工介入** | 介入次数、等待审批时长、接管成功率 | 人工操作必须可追踪，且能及时影响在途任务 |
| **安全** | 越权拦截率、提示注入传播范围、敏感数据暴露事件 | 权限按 Agent 和工具隔离，跨边界操作需要审批 |
| **可观测性** | 日志完整率、trace 关联率、失败根因可定位率 | UI、日志和指标中的状态必须一致，不展示虚假完成 |

### 非功能性约束

- 所有状态转换、消息投递和外部副作用均应支持幂等处理。
- 不以隐藏思维链作为可观测性目标；只记录任务、事件、工具、证据、预算、决策结果与必要摘要。
- 共享工作区默认采用隔离目录、worktree 或明确锁策略，不允许无保护地并发修改同一资源。
- 团队规模、并发、token、工具调用、超时和重试均由配置控制，不在代码中绑定厂商宣传上限。
- 在模型不可用、配额耗尽、工具失败或部分成员离线时，系统必须能降级、暂停或交由人工处理。

<a id="unknowns"></a>

## 待研发核实的技术问题

下列问题在公开资料中尚无统一口径，或与具体版本、套餐和运行环境相关。进入技术方案评审前，应明确哪些由本系统实现、哪些依赖模型或第三方平台，以及无法确认时的默认降级策略。

- **规模不是并发，也不是有效并行** — 要求厂商同时给出创建数、峰值活跃数、平均活跃数、队列长度、关键路径和完成覆盖率。
- **验证器也会错** — Verifier 只是另一个模型。高风险场景仍需工具证据、独立数据源、确定性测试和人类签字。
- **共享上下文会形成 token 广播税** — 每次给所有成员同步全部信息，成本会随成员数 × 轮数上升；需要结构化 handoff 和按需拉取。
- **共享工作区会放大写冲突** — 代码产品应默认 worktree / branch / 文件 ownership；文档产品也需要制品版本、锁与合并策略。
- **群聊扩大权限与提示注入半径** — 外部 Claw、不同用户与数据源同时进入后，应提供 capability token、最小权限、来源标记和跨边界审批。
- **失败被“漂亮的总结果”掩盖** — 主 Agent 的汇总页必须展示未完成、低置信、来源缺失、降级路线和未通过验收项。
- **持久记忆不是免费能力** — 长期团队需要记忆写入规则、可解释更新、纠错、过期、访问控制和离职 / 移除成员后的数据处理。
- **当前会员与价格变化极快** — 报告保留研究日期；落地采购前应重新打开官方套餐页核验区域、席位、积分和实验功能状态。

### 外部产品仍未公开的关键参数

| 产品 | 明确未知 | 建议核实项 |
| --- | --- | --- |
| **Claude Code** | 团队硬上限、按成员预算、可复用 team manifest、Lead 转移、自动 worktree | 组织策略能否限制团队规模 / 模型 / 花费？如何导出完整团队审计？ |
| **Kimi Swarm** | 300 与套餐 2/4/8 的映射、逐 Agent token、失败覆盖提示、调度阈值 | 单任务真实活跃并发 P50/P95？创建 / 排队 / 完成各是多少？ |
| **MiniMax Code** | 单队上限、默认重试 / 预算熔断、成员异构模型、Team 专属 A/B | Verifier 如何校准？何时停止返工？每阶段成本能否分账？ |
| **WorkBuddy** | 自定义专家团完整配置、成员上限、通信拓扑、逐成员模型、免费权益 | 预设模板是否可查看 / 版本化？子 Agent 失败、权限与制品冲突如何治理？ |
| **Kimi Claw** | 单群成员上限、Conductor 预算 / 接管策略、跨用户数据隔离 | 外部 Claw 的权限声明与审计标准？Thread / Workspace 数据生命周期？ |

**关于“黑箱”：** 没有任何主流产品会公开完整隐藏推理。更可行的评价是“执行可观察性”：是否看得到任务图、成员状态、消息、工具、来源、预算、失败、审批与制品版本。Claude 较强在控制面，Kimi 强在过程可视化但编队策略自动，MiniMax 强在架构说明与验证状态机，WorkBuddy 强在业务流程 / 制品 UI；四者的调度核心都仍是闭源或非确定性的。

<a id="sources"></a>

## 来源索引与证据说明

A 类优先支持事实；B / C 类只用于操作体验、缺陷与个案，不用来替代当前价格或硬上限。部分产品文档在数月内已变更，因此保留研究日期并显式标注冲突。

### 官方 / 论文（A）

- **A01** [Claude Code — Agent teams](https://code.claude.com/docs/en/agent-teams) — 架构、启用、操作、上限建议、限制。
- **A02** [Claude Code — Manage costs](https://code.claude.com/docs/en/costs) — Agent Teams plan mode 约 7× token。
- **A03** [Claude Code — Feature availability](https://code.claude.com/docs/en/feature-availability) — provider / 功能可用性背景。
- **A04** [Anthropic — Claude Opus 4.6](https://www.anthropic.com/news/claude-opus-4-6) — Agent Teams research preview 发布。
- **A05** [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — 编排原理、90.2% 内部提升、token 成本与适用边界。
- **A06** [Anthropic — Building a C compiler with parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler) — 早期 16-agent 自建 harness 案例。
- **A07** [Kimi — Agent Swarm 帮助](https://www.kimi.com/zh-cn/help/agent/agent-swarm) — 当前入口、过程与产物。
- **A08** [Kimi K2.6 发布](https://www.kimi.com/blog/kimi-k2-6) — 300 子 Agent、4,000 步等厂商口径。
- **A09** [Kimi K2.5: Visual Agentic Intelligence](https://arxiv.org/abs/2602.02276) — PARL、Swarm benchmark 与加速数据。
- **A10** [Kimi K3 定价详解](https://www.kimi.com/zh-cn/resources/kimi-k3-pricing) — 中国区当前套餐与集群资源口径。
- **A11** [Kimi — Agent 额度与计费](https://www.kimi.com/zh-cn/help/agent/agent-quota-and-billing) — 共享额度与任务计费逻辑。
- **A12** [Kimi — Claw 群聊指南](https://www.kimi.com/zh-cn/help/kimi-claw/kimiclaw-group-chat) — Conductor、Worker、Thread、@、权限与群规则。
- **A13** [Kimi Claw 概览](https://www.kimi.com/zh-cn/help/kimi-claw/overview) — 托管 OpenClaw、记忆、Skills、渠道与设备。
- **A14** [Kimi Code CLI — Tools / AgentSwarm](https://www.kimi.com/code/docs/kimi-code-cli/reference/tools.html) — 128 上限、并发增长与运行方式。
- **A15** [Kimi Code CLI — Slash commands](https://www.kimi.com/code/docs/kimi-code-cli/reference/slash-commands.html) — /swarm 开关与任务级调用。
- **A16** [Kimi Code — Custom agents](https://www.kimi.com/code/docs/kimi-code-cli/customization/agents.html) — profile、模型、工具、下级 Agent 自定义。
- **A17** [MiniMax — Agent Team for long-running tasks](https://www.minimax.io/blog/minimax-agent-team-long-running-1779893953) — Leader–Worker–Verifier、Team Engine、交接成本与场景。
- **A18** [MiniMax Code — Agent Team](https://agent.minimax.io/docs/code/agents/team) — 用户组队与成员管理。
- **A19** [MiniMax Code — Custom Agents](https://agent.minimax.io/docs/code/agents/custom-agents) — 角色、指令、工作区、Skills、频道。
- **A20** [MiniMax Token Plan](https://platform.minimax.io/docs/guides/pricing-token-plan) — Plus / Max / Ultra、窗口与 Agent usage。
- **A21** [WorkBuddy — 专家 / 专家团](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Expert-Center) — 定义、召唤流程、3–5× 积分。
- **A22** [WorkBuddy — 新建任务栏](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Task-Bar) — Ask / Craft / Plan、工作区与多任务。
- **A23** [WorkBuddy — 定价](https://www.workbuddy.cn/docs/workbuddy/Pricing) — 2026-07 起个人 / 企业套餐与积分。
- **A24** [WorkBuddy — 更新日志](https://www.workbuddy.cn/docs/workbuddy/Changelog) — 自定义专家团、子 Agent UI、稳定性与安全修复。
- **A25** [WorkBuddy — 企业智能体](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/CloudAgent) — Manifest、Skills、MCP、知识库与 subagents。
- **A26** [CodeBuddy — Agent Teams](https://www.codebuddy.ai/docs/cli/agent-teams) — 腾讯编码产品的团队运行时；与 WorkBuddy 专家团区分。
- **A27** [Qwen Code — Agent Team update](https://qwenlm.github.io/qwen-code-docs/en/blog/updates/weekly-update-2026-06-18/) — 实验开关、长期 teammate 与共享任务。
- **A28** [Manus — Wide Research](https://manus.im/docs/features/wide-research) — 批量独立 Agent 与规模口径。
- **A29** [Cursor — /multitask](https://cursor.com/changelog/04-24-26) — 异步 subagents / fleet 与 worktree。
- **A30** [OpenAI — Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/) — 多 Agent 控制台、项目、线程与 worktree。
- **A31** [OpenAI — Codex orchestration with Symphony](https://openai.com/index/open-source-codex-orchestration-symphony/) — 任务控制面与并行软件开发案例。
- **A32** [AWS Bedrock — Create multi-agent collaboration](https://docs.aws.amazon.com/bedrock/latest/userguide/create-multi-agent-collaboration.html) — Supervisor / collaborator、10 个上限与平台限制。
- **A33** [Microsoft Copilot Studio — Add other agents](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-add-other-agents) — 连接 Agent、自动编排与 activity map。
- **A34** [Salesforce — Multi-agent orchestration](https://www.salesforce.com/agentforce/multi-agent-orchestration/) — Agentforce Superagent 与企业协作。
- **A35** [Oracle AI Agent Studio](https://docs.oracle.com/en/cloud/saas/fusion-ai/26b/aiaas/get-started.html) — Agent Team、Supervisor / Workflow、HITL 与部署。
- **A36** [IBM watsonx — Orchestrating agents](https://www.ibm.com/docs/en/watsonx/watson-orchestrate/base?topic=agents-orchestrating) — Primary / collaborators 与嵌套协作。
- **A37** [OpenAI Agents SDK — Multi-agent orchestration](https://openai.github.io/openai-agents-python/multi_agent/) — Manager、handoff、代码编排与并行。
- **A38** [AutoGen — Teams](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/teams.html) — RoundRobin、Selector、Magentic-One、Swarm。
- **A39** [CrewAI documentation](https://docs.crewai.com/) — Agents、Tasks、Crews 与 Flows。
- **A40** [LangGraph — Multi-agent collaboration](https://langchain-ai.github.io/langgraph/tutorials/multi_agent/multi-agent-collaboration/) — 图状态、supervisor 与 handoff。
- **A41** [Google ADK — Multi-agent systems](https://google.github.io/adk-docs/agents/multi-agents/) — LLM / workflow agents，顺序、并行与循环。
- **A42** [MetaGPT introduction](https://docs.deepwisdom.ai/main/en/guide/get_started/introduction.html) — 软件公司角色与 SOP。
- **A43** [CAMEL Workforce](https://docs.camel-ai.org/key_modules/workforce) — orchestrator、worker 与可扩展 team。
- **A44** [OpenClaw — Broadcast groups](https://docs.openclaw.ai/channels/broadcast-groups) — 消息 fan-out、隔离会话与当前渠道限制。
- **A45** [Clawpond / 虾塘](https://clawpond.org/) — Agent 群聊、Daemon 与多 CLI runtime。
- **A46** [FloatIM introduction](https://floatboat.ai/blog/introducing-floatim) — Agent-native messaging、群、角色与权限。
- **A47** [AgentDM / Teamfuse](https://agentdm.ai/) — Agent-to-Agent channels / DM 与角色。
- **A48** [Devin — Managed Devins](https://docs.devin.ai/work-with-devin/advanced-capabilities) — 主 Devin、独立 VM 子会话、用户审批与多会话管理。
- **A49** [GitHub Copilot Agent HQ](https://github.com/features/copilot/agents) — 多供应商 Agent 控制面、任务、PR 与自定义 Agent。
- **A55** [Google Research — Scaling agent systems](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/) — 180 配置、并行提升、顺序退化与错误放大。
- **A56** [OpenAI — A practical guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/) — 先最大化单 Agent、manager 与 handoff 架构。

### 第三方实测 / 中文资料（B / C）

- **B48** [DataCamp — Kimi Agent Swarm practical examples](https://www.datacamp.com/tutorial/kimi-k2-agent-swarm-guide) — 创建数、活跃并发、强依赖任务退化；早期 K2.5。
- **B49** [APPSO / PConline — Kimi 100 Agent 实测](https://g.pconline.com.cn/x/2081/20817612.html) — 宽度收益、耗时、访问受限与细节缺陷。
- **B50** [TechRadar — Kimi review](https://www.techradar.com/pro/kimi-ai-review) — 编排透明度与子任务失败提示的当前体验。
- **B51** [Spectacle — Claude Agent Teams review comparison](https://spectacle.world/contents/claude-code-agent-teams-setup-and-review-comparison/) — 单次 code review 对比；旧版本、小样本。
- **C52** [Coder Legion — Claude Agent Teams personal experience](https://coderlegion.com/11808/claude-code-agent-teams-what-the-docs-dont-tell-you) — 个人成本与适用性观察，非基准。
- **B53** [人人都是产品经理 — WorkBuddy 专家团机制分析](https://www.woshipm.com/ai/6424770.html) — 特定专家团模板与产品化工作流；不能外推全内核。
- **B54** [量子位 / 知乎 — MiniMax Mavis Agent Team 实测](https://zhuanlan.zhihu.com/p/2038334895634772430) — 角色组成、Verifier 与 HTML 交付个案。
- **B57** [APPSO / 新浪科技 — Claw 群聊早期实测](https://finance.sina.com.cn/tech/roll/2026-04-21/doc-inhvhrra4878541.shtml) — 异构 Claw、角色漂移、协调接管与稳定性。
- **C58** [腾讯云开发者社区 — WorkBuddy 多 Agent 案例](https://developer.cloud.tencent.com/article/2710736) — 用户实操个案；时间 / 积分不可当标准基准。
- **C59** [CSDN — Claude Code Agent Teams 实战模板](https://blog.csdn.net/xinjichenlibing/article/details/158038012) — 可参考角色 Prompt 结构；版本与 token 区间不作为当前事实。

### 研究方法与限制

- 优先查看厂商官网、官方文档、帮助中心、更新日志、论文与定价页；第三方文章用于补 UI 体验与失败模式。
- 对同名能力按产品面拆开：Kimi.com Swarm ≠ Kimi Code CLI AgentSwarm；WorkBuddy 专家团 ≠ CodeBuddy Agent Teams ≠ 人类 Teams 项目。
- 对冲突数据保留两个口径，并说明可能来自地区、版本、套餐或“创建 / 活跃 / 并发 / 峰值”定义差异。
- 未引用页面截图：产品 UI 与套餐在 2026 年高频变化，原生结构图、可检索文本和直接官网链接更利于复核；报告使用自绘 CSS 图形避免过期截图误导。
- 本报告不是安全审计、采购承诺或财务报价；计划落地时需要重新核验当前区域、账号、组织策略和实验功能状态。

---
> # Documentation Index
# 附录 A：协调 Claude Code 会话团队

<a id="appendix-claude-agent-teams"></a>


> 官方原文：[Claude Code Docs — 协调 Claude Code 会话团队](https://code.claude.com/docs/zh-CN/agent-teams)


> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt

> Use this file to discover all available pages before exploring further.

> 协调多个 Claude Code 实例作为一个团队一起工作，具有共享任务、代理间消息传递和集中管理。

> [!WARNING]
> Agent teams 是实验性功能，默认禁用。通过将 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 添加到你的 [settings.json](https://code.claude.com/docs/zh-CN/settings) 或环境变量来启用它们。如果没有该变量，会话启动时不会设置任何团队，不会写入团队目录，Claude 也不会生成或提议队友。Agent teams 在 [已知限制](#limitations) 中存在关于会话恢复、任务协调和关闭行为的问题。

Agent teams 让你协调多个 Claude Code 实例一起工作。一个会话充当团队负责人，协调工作、分配任务和综合结果。队友独立工作，每个都在自己的 context window 中，并直接相互通信。

与 [subagents](https://code.claude.com/docs/zh-CN/sub-agents) 不同，subagents 在单个会话中运行，只能向主代理报告，你也可以直接与个别队友互动，无需通过负责人。

> [!NOTE]
> 本页描述的是 v2.1.178 版本的 agent teams。设置 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 后，生成队友不再需要设置步骤，会话退出时会自动清理。在 v2.1.178 之前，你需要要求 Claude 先创建并命名一个团队，Claude 使用 `TeamCreate` 和 `TeamDelete` 工具来设置和删除它。这两个工具已不再存在。Agent 工具上的 `team_name` 输入被接受但被忽略，`TaskCreated`、`TaskCompleted` 和 `TeammateIdle` [hook payloads](https://code.claude.com/docs/zh-CN/hooks#taskcreated) 中的 `team_name` 字段携带会话派生的名称，已被弃用。

<a id="when-to-use-agent-teams"></a>

## A1. 何时使用 agent teams

Agent teams 最适合用于并行探索能增加真实价值的任务。有关完整场景，请参阅 [用例示例](#use-case-examples)。最强的用例是：

* **研究和审查**：多个队友可以同时调查问题的不同方面，然后分享和质疑彼此的发现
* **新模块或功能**：队友可以各自拥有一个独立的部分，不会相互干扰
* **使用竞争假设进行调试**：队友并行测试不同的理论，更快地收敛到答案
* **跨层协调**：跨越前端、后端和测试的更改，每个由不同的队友负责

Agent teams 增加了协调开销，使用的令牌数量明显多于单个会话。当队友可以独立运作时，它们效果最好。对于顺序任务、同一文件编辑或有许多依赖关系的工作，单个会话或 [subagents](https://code.claude.com/docs/zh-CN/sub-agents) 更有效。

<a id="compare-with-subagents"></a>

### 与 subagents 比较

Agent teams 和 [subagents](https://code.claude.com/docs/zh-CN/sub-agents) 都让你并行化工作，但它们的运作方式不同。根据你的工作人员是否需要相互通信来选择：

> **图示：** Subagents 仅向主代理报告结果，彼此不交谈。在 agent teams 中，队友共享任务列表、认领工作并直接相互通信。

![比较 subagent 和 agent team 架构的图表。Subagents 由主代理生成、执行工作并报告结果。Agent teams 通过共享任务列表进行协调，队友彼此直接通信。](https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-light.png?fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=2f8db9b4f3705dd3ab931fbe2d96e42a)

[查看该图的深色主题版本](https://mintcdn.com/claude-code/nsvRFSDNfpSU5nT7/images/subagents-vs-agent-teams-dark.png?fit=max&auto=format&n=nsvRFSDNfpSU5nT7&q=85&s=d573a037540f2ada6a9ae7d8285b46fd)

|             | Subagents                   | Agent teams             |
| :---------- | :-------------------------- | :---------------------- |
| **Context** | 自己的 context window；结果返回给调用者 | 自己的 context window；完全独立 |
| **通信**      | 仅向主代理报告结果                   | 队友直接相互发送消息              |
| **协调**      | 主代理管理所有工作                   | 具有自我协调的共享任务列表           |
| **最适合**     | 只有结果重要的专注任务                 | 需要讨论和协作的复杂工作            |
| **令牌成本**    | 较低：结果汇总回主 context           | 较高：每个队友是一个独立的 Claude 实例 |

当你需要快速、专注的工作人员报告结果时，使用 subagents。当队友需要分享发现、相互质疑和自我协调时，使用 agent teams。

<a id="enable-agent-teams"></a>

## 启用 agent teams

Agent teams 默认禁用。通过将 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 环境变量设置为 `1`，在你的 shell 环境中或通过 [settings.json](https://code.claude.com/docs/zh-CN/settings) 来启用它：

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

<a id="start-your-first-agent-team"></a>

## 启动你的第一个 agent team

启用 agent teams 后，用自然语言描述你想要的任务和队友。Claude 会生成他们并根据你的提示协调工作。

这个例子效果很好，因为三个角色是独立的，可以在不相互等待的情况下探索问题：

```text
I'm designing a CLI tool that helps developers track TODO comments across
their codebase. Spawn three teammates to explore this from different angles:
one on UX, one on technical architecture, one playing devil's advocate.
```

从那里，Claude 会填充一个 [共享任务列表](https://code.claude.com/docs/zh-CN/interactive-mode#task-list)，为每个角度生成队友，让他们探索问题，并在完成时综合发现。

负责人的终端在提示输入下方的 agent 面板中列出队友。从该面板中：

* **向上和向下箭头**：选择一个队友
* **Enter**：打开所选队友的记录并直接向其发送消息
* **Escape**：中断所选队友的当前轮次

<!-- min-version: 2.1.199 -->

从 v2.1.199 开始，当任何队友或子 agent 仍在工作时，空闲队友的行会保留在面板中，因此你可以选择它来查看其记录或向其分配更多工作。一旦面板中的每个 agent 都处于空闲状态，空闲行会在 30 秒后隐藏，并在队友的下一轮时重新出现；队友在隐藏时仍然保持运行并可寻址。在 v2.1.181 到 v2.1.198 中，空闲行在其自己的轮次结束后 30 秒隐藏，即使其他队友仍在工作；v2.1.181 之前的版本不隐藏空闲行。

当超过三个队友同时处于空闲状态时，前三个之外的行会折叠成一行，计数折叠的队友，例如当五个处于空闲状态时显示 `2 idle agents`。选择它并按 Enter 展开折叠的行，或按 Esc 再次折叠它们。工作中的队友、失败的队友和你正在查看的队友始终保持自己的行。

如果你想让每个队友在自己的分割窗格中，请参阅 [选择显示模式](#choose-a-display-mode)。

<a id="control-your-agent-team"></a>

## A2. 控制你的 agent team

用自然语言告诉负责人你想要什么。它根据你的指示处理团队协调、任务分配和委派。

<a id="choose-a-display-mode"></a>

### 选择显示模式

Agent teams 支持两种显示模式：

* **In-process**：所有队友在你的主终端内运行。在 agent 面板中使用上下箭头键选择队友，然后按 Enter 查看它并输入以直接向它发送消息。在任何终端中工作，无需额外设置。
* **Split panes**：每个队友获得自己的窗格。你可以同时看到每个人的输出，并点击窗格直接交互。需要 tmux 或 iTerm2。

> [!NOTE]
> `tmux` 在某些操作系统上有已知限制，传统上在 macOS 上效果最好。在 iTerm2 中使用 `tmux -CC` 是进入 `tmux` 的建议入口点。

默认值是 `"in-process"`。在 v2.1.179 之前，默认值是 `"auto"`，所以升级的会话如果之前打开了分割窗格，现在会保持在一个终端中，除非你显式设置模式。设置 `"auto"` 以在你已经在 tmux 会话中运行或你的终端是 iTerm2 时启用分割窗格，否则回退到 in-process。`"tmux"` 设置启用分割窗格模式，并根据你的终端自动检测是使用 tmux 还是 iTerm2。

<!-- min-version: 2.1.186 -->

从 v2.1.186 开始，设置 `"iterm2"` 以显式使用 iTerm2 原生分割窗格。此模式需要 [`it2` CLI](https://github.com/mkusaka/it2)，如果 `it2` 缺失，会显示带有安装命令的错误。当你的终端是 iTerm2 且 tmux 可用作备选方案时，在 `"auto"` 或 `"tmux"` 下会出现提供安装 `it2` 或切换到 tmux 的设置提示。

要覆盖默认值，在 `~/.claude/settings.json` 中设置 [`teammateMode`](https://code.claude.com/docs/zh-CN/settings#available-settings)：

```json
{
  "teammateMode": "auto"
}
```

要为单个会话设置模式，将其作为标志传递：

```bash
claude --teammate-mode auto
```

分割窗格模式需要 [tmux](https://github.com/tmux/tmux/wiki) 或 iTerm2 与 [`it2` CLI](https://github.com/mkusaka/it2)。手动安装：

* **tmux**：通过你的系统包管理器安装。有关特定于平台的说明，请参阅 [tmux wiki](https://github.com/tmux/tmux/wiki/Installing)。
* **iTerm2**：安装 [`it2` CLI](https://github.com/mkusaka/it2)，然后在 **iTerm2 → Settings → General → Magic → Enable Python API** 中启用 Python API。

<a id="specify-teammates-and-models"></a>

### 指定队友和模型

Claude 根据你的任务决定要生成的队友数量，或者你可以指定你想要的确切内容：

```text
Spawn 4 teammates to refactor these modules in parallel. Use Sonnet for
each teammate.
```

队友默认不继承负责人的 `/model` 选择。要更改在提示未指定模型时使用的模型，在 `/config` 中设置**默认队友模型**。选择**默认（负责人的模型）**以让队友遵循负责人的当前模型。

<!-- min-version: 2.1.186 -->

队友继承负责人的[工作量级别](https://code.claude.com/docs/zh-CN/model-config#adjust-effort-level)。在分割窗格模式中，这从 v2.1.186 开始适用；较早的版本没有将负责人的会话工作量传递给分割窗格队友。

<a id="require-plan-approval-for-teammates"></a>

### 要求队友的计划批准

对于复杂或有风险的任务，你可以要求队友在实施前进行规划。队友在只读计划模式下工作，直到负责人批准他们的方法：

```text
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

当队友完成规划时，它向负责人发送计划批准请求。负责人审查计划并批准或拒绝并提供反馈。如果被拒绝，队友保持在计划模式，根据反馈进行修订并重新提交。一旦批准，队友退出计划模式并开始实施。

负责人自主做出批准决定。要影响负责人的判断，在你的提示中给出标准，例如"仅批准包括测试覆盖的计划"或"拒绝修改数据库架构的计划"。

<a id="talk-to-teammates-directly"></a>

### 直接与队友交谈

每个队友都是一个完整的、独立的 Claude Code 会话。你可以直接向任何队友发送消息，以提供额外的指示、提出后续问题或改变他们的方法。

* **In-process 模式**：在 agent 面板中使用上下箭头键选择队友，然后按 Enter 查看其会话并输入以向其发送消息。在选定的队友上按 `x` 以停止它。按 Ctrl+T 切换任务列表。
* **Split-pane 模式**：点击队友的窗格以直接与他们的会话交互。每个队友都有自己终端的完整视图。

当你查看 in-process 队友时，纯文本和 [skills](https://code.claude.com/docs/zh-CN/skills) 会发送给该队友，但内置命令仍在负责人的会话中运行。

队友的模型和快速模式在它生成时是固定的，所以 `/model` 和 `/fast` 只改变负责人的设置。

<!-- min-version: 2.1.199 -->

从 v2.1.199 开始，在查看队友时输入任一命令会显示一个通知，表示更改适用于负责人；较早的版本会将其应用于负责人而没有任何指示。`/effort` 仍然适用于所查看队友的后续轮次，因为队友遵循负责人的[工作量级别](https://code.claude.com/docs/zh-CN/model-config#adjust-effort-level)。

<a id="assign-and-claim-tasks"></a>

### 分配和认领任务

共享任务列表协调整个团队的工作。负责人创建任务，队友完成它们。任务有三种状态：待处理、进行中和已完成。任务也可以依赖其他任务：具有未解决依赖关系的待处理任务在这些依赖关系完成之前无法被认领。

负责人可以显式分配任务，或队友可以自我认领：

* **负责人分配**：告诉负责人将哪个任务分配给哪个队友
* **自我认领**：完成任务后，队友自己选择下一个未分配、未阻止的任务

任务认领使用文件锁定来防止多个队友同时尝试认领同一任务时的竞态条件。

<a id="shut-down-teammates"></a>

### 关闭队友

要优雅地结束队友的会话，按名称引用它。例如，对于一个名为 researcher 的队友：

```text
Ask the researcher teammate to shut down
```

负责人发送关闭请求。队友可以批准，优雅地退出，或拒绝并提供解释。

团队的共享目录在会话结束时自动清理，因此没有单独的清理步骤。请参阅[架构](#architecture)了解哪些目录被删除以及哪些目录为恢复的会话保留。

<a id="enforce-quality-gates-with-hooks"></a>

### 使用 hooks 强制质量门

使用 [hooks](https://code.claude.com/docs/zh-CN/hooks) 在队友完成工作或任务创建或完成时强制执行规则：

* [`TeammateIdle`](https://code.claude.com/docs/zh-CN/hooks#teammateidle)：当队友即将空闲时运行。以代码 2 退出以发送反馈并保持队友工作。
* [`TaskCreated`](https://code.claude.com/docs/zh-CN/hooks#taskcreated)：当任务被创建时运行。以代码 2 退出以防止创建并发送反馈。
* [`TaskCompleted`](https://code.claude.com/docs/zh-CN/hooks#taskcompleted)：当任务被标记为完成时运行。以代码 2 退出以防止完成并发送反馈。

<a id="how-agent-teams-work"></a>

## A3. Agent teams 如何工作

本部分涵盖 agent teams 背后的架构和机制。如果你想开始使用它们，请参阅上面的 [控制你的 agent team](#control-your-agent-team)。

<a id="how-claude-starts-agent-teams"></a>

### Claude 如何启动 agent teams

当第一个队友被生成时，agent team 就形成了，主会话充当负责人。队友有两种方式被生成：

* **你请求队友**：给 Claude 一个受益于并行工作的任务，并明确要求队友。Claude 根据你的指示生成他们。
* **Claude 提议队友**：如果 Claude 确定你的任务将受益于并行工作，它可能会建议生成队友。你在它继续之前确认。

在这两种情况下，你都保持控制。Claude 不会在没有你的批准的情况下生成队友。

<a id="architecture"></a>

### 架构

Agent team 由以下部分组成：

| 组件            | 角色                         |
| :------------ | :------------------------- |
| **Team lead** | 生成队友并协调工作的主 Claude Code 会话 |
| **Teammates** | 各自处理分配任务的独立 Claude Code 实例 |
| **Task list** | 队友认领和完成的共享工作项列表            |
| **Mailbox**   | 代理之间通信的消息系统                |

有关显示配置选项，请参阅 [选择显示模式](#choose-a-display-mode)。队友消息自动到达负责人。

每个代理的邮箱是位于 `~/.claude/teams/{team-name}/inboxes/{agent-name}.json` 的 JSON 文件。Claude Code 在读取邮箱文件时验证每个条目。不匹配消息格式的条目被报告为错误并从文件中删除；有效的消息仍然会被传递。在 v2.1.207 之前，单个格式错误的邮箱条目会导致每秒重复出现错误，并阻止该邮箱的传递，直到你手动删除文件。

系统自动管理任务依赖关系。当队友完成其他任务依赖的任务时，被阻止的任务会自动解除阻止。

团队和任务存储在本地，名称来自会话派生的名称。名称是 `session-` 后跟会话 ID 的前八个字符：

* **Team config**：`~/.claude/teams/{team-name}/config.json`
* **Task list**：`~/.claude/tasks/{team-name}/`

Claude Code 在会话启动时自动生成这两个，并在队友加入、空闲或离开时更新它们。团队配置目录在会话结束时被删除。任务列表目录在本地持久化，永远不会上传，所以恢复的会话会保留它们的任务。保留期由你已经为会话记录控制的相同 [`cleanupPeriodDays`](https://code.claude.com/docs/zh-CN/settings#available-settings) 管理。

团队配置保存运行时状态，例如会话 ID 和 tmux 窗格 ID，所以不要手动编辑它或预先编写它：你的更改会在下一次状态更新时被覆盖。

要定义可重用的队友角色，请改用 [subagent 定义](#use-subagent-definitions-for-teammates)。

团队配置包含一个 `members` 数组，其中包含每个队友的名称、代理 ID 和代理类型。队友可以读取此文件以发现其他团队成员。

没有项目级别的团队配置等效项。项目目录中的 `.claude/teams/teams.json` 之类的文件不被识别为配置；Claude 将其视为普通文件。

<a id="use-subagent-definitions-for-teammates"></a>

### 为队友使用 subagent 定义

当生成队友时，你可以引用来自任何 [subagent 范围](https://code.claude.com/docs/zh-CN/sub-agents#choose-the-subagent-scope) 的 [subagent](https://code.claude.com/docs/zh-CN/sub-agents) 类型：项目、用户、插件或 CLI 定义。这让你定义一个角色一次，例如安全审查员或测试运行器，并将其同时重用为委派的 subagent 和 agent team 队友。

要使用 subagent 定义，在要求 Claude 生成队友时按名称提及它：

```text
Spawn a teammate using the security-reviewer agent type to audit the auth module.
```

队友遵守该定义的 `tools` 允许列表和 `model`，定义的主体被附加到队友的系统提示作为额外指示，而不是替换它。Team coordination tools 例如 `SendMessage` 和任务管理工具始终对队友可用，即使 `tools` 限制其他工具。

> [!NOTE]
> subagent 定义中的 `skills` 和 `mcpServers` frontmatter 字段在该定义作为队友运行时不被应用。队友从你的项目和用户设置加载 skills 和 MCP servers，与常规会话相同。

<a id="permissions"></a>

### 权限

队友从负责人的权限设置开始。如果负责人使用 `--dangerously-skip-permissions` 运行，所有队友也会这样做。生成后，你可以更改个别队友模式，但在生成时无法设置每个队友的模式。

当一个代理通过 `SendMessage` 向另一个代理发送消息时，接收代理被告知它来自另一个 Claude 会话，而不是来自你。队友无法批准权限提示或代表你提供同意，被拒绝某项操作的队友无法将其转发给另一个队友以绕过检查。在 [auto mode](https://code.claude.com/docs/zh-CN/permission-modes#eliminate-prompts-with-auto-mode) 中，分类器将从另一个代理转发的批准声明视为不受信任的输入，而不是来自你的确认。

队友权限提示会冒泡到负责人会话，所以请在那里自己批准它们。[Plan approval](#require-plan-approval-for-teammates) 是设计的例外：负责人会话授予队友计划批准，无需向你单独提示。

<a id="context-and-communication"></a>

### Context 和通信

每个队友都有自己的 context window。生成时，队友加载与常规会话相同的项目 context：CLAUDE.md、MCP servers 和 skills。它还接收来自负责人的生成提示。负责人的对话历史不会继承。

**队友如何共享信息：**

* **自动消息传递**：当队友发送消息时，它们会自动传递给收件人。负责人不需要轮询更新。
* **空闲通知**：当队友完成并停止时，他们会自动通知负责人。从 v2.1.198 开始，其轮次因 API 错误而结束的队友会通知负责人它失败了并包含错误文本，而不是显示为正常完成。
* **共享任务列表**：所有代理都可以看到任务状态并认领可用工作。
* **队友消息传递**：按名称向一个特定的队友发送消息。要联系所有人，请为每个收件人发送一条消息。

负责人在生成队友时为其分配一个名称，任何队友都可以按该名称向任何其他队友发送消息。要获得可预测的名称，你可以在后续提示中引用，在你的生成指令中告诉负责人如何称呼每个队友。

<a id="token-usage"></a>

### 令牌使用

Agent teams 使用的令牌数量明显多于单个会话。每个队友都有自己的 context window，令牌使用量随活跃队友数量而增加。对于研究、审查和新功能工作，额外的令牌通常是值得的。对于日常任务，单个会话更具成本效益。有关使用指导，请参阅 [agent team 令牌成本](https://code.claude.com/docs/zh-CN/costs#agent-team-token-costs)。

<a id="use-case-examples"></a>

## A4. 用例示例

这些示例展示了 agent teams 如何处理并行探索增加价值的任务。

<a id="run-a-parallel-code-review"></a>

### 运行并行代码审查

单个审查者往往一次只关注一种类型的问题。将审查标准分解为独立的领域意味着安全性、性能和测试覆盖都同时获得彻底的关注。提示为每个队友分配一个不同的视角，以便他们不重叠：

```text
Spawn three teammates to review PR #142:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

每个审查者从同一个 PR 工作，但应用不同的过滤器。负责人在他们完成后综合所有三个的发现。

<a id="investigate-with-competing-hypotheses"></a>

### 使用竞争假设进行调查

当根本原因不清楚时，单个代理往往会找到一个看似合理的解释并停止寻找。提示通过让队友明确对抗来对抗这一点：每个队友的工作不仅是调查自己的理论，还要质疑其他队友的理论。

```text
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

辩论结构是这里的关键机制。顺序调查受到锚定的影响：一旦探索了一个理论，后续调查就会偏向于它。

有多个独立的调查者积极尝试相互反驳，存活下来的理论更有可能是实际的根本原因。

<a id="best-practices"></a>

## A5. 最佳实践

<a id="give-teammates-enough-context"></a>

### 给队友足够的 context

队友自动加载项目 context，包括 CLAUDE.md、MCP servers 和 skills，但他们不继承负责人的对话历史。有关详细信息，请参阅 [Context 和通信](#context-and-communication)。在生成提示中包含特定于任务的详细信息：

```text
Spawn a security reviewer teammate with the prompt: "Review the authentication module
at src/auth/ for security vulnerabilities. Focus on token handling, session
management, and input validation. The app uses JWT tokens stored in
httpOnly cookies. Report any issues with severity ratings."
```

<a id="choose-an-appropriate-team-size"></a>

### 选择适当的团队规模

队友数量没有硬限制，但实际限制适用：

* **令牌成本线性增加**：每个队友都有自己的 context window 并独立消耗令牌。有关详细信息，请参阅 [agent team 令牌成本](https://code.claude.com/docs/zh-CN/costs#agent-team-token-costs)。
* **协调开销增加**：更多队友意味着更多通信、任务协调和潜在冲突
* **收益递减**：超过一定点，额外的队友不会按比例加快工作

对于大多数工作流，从 3-5 个队友开始。这平衡了并行工作和可管理的协调。本指南中的示例使用 3-5 个队友，因为该范围在不同任务类型中效果很好。

每个队友有 5-6 个 [tasks](https://code.claude.com/docs/zh-CN/agent-teams#architecture) 可以让每个人保持生产力，而不会过度的上下文切换。如果你有 15 个独立任务，3 个队友是一个很好的起点。

仅当工作真正受益于队友同时工作时才扩展。三个专注的队友通常胜过五个分散的队友。

<a id="size-tasks-appropriately"></a>

### 适当调整任务大小

* **太小**：协调开销超过收益
* **太大**：队友长时间工作而不进行检查，增加浪费努力的风险
* **恰到好处**：自包含的单位，产生清晰的可交付成果，例如函数、测试文件或审查

> [!TIP]
> 负责人将工作分解为任务并自动分配给队友。如果它没有创建足够的任务，要求它将工作分成更小的部分。每个队友有 5-6 个任务可以让每个人保持生产力，并让负责人在有人卡住时重新分配工作。

<a id="wait-for-teammates-to-finish"></a>

### 等待队友完成

有时负责人开始自己实施任务，而不是等待队友。如果你注意到这一点：

```text
Wait for your teammates to complete their tasks before proceeding
```

<a id="start-with-research-and-review"></a>

### 从研究和审查开始

如果你是 agent teams 的新手，从具有明确边界且不需要编写代码的任务开始：审查 PR、研究库或调查错误。这些任务展示了并行探索的价值，而不会带来并行实施所带来的协调挑战。

<a id="avoid-file-conflicts"></a>

### 避免文件冲突

两个队友编辑同一文件会导致覆盖。分解工作，使每个队友拥有不同的文件集。

<a id="monitor-and-steer"></a>

### 监控和指导

检查队友的进度，重定向不起作用的方法，并在发现时综合发现。让团队无人值守运行太长时间会增加浪费努力的风险。

<a id="troubleshooting"></a>

## A6. 故障排除

<a id="teammates-not-appearing"></a>

### 队友未出现

如果在你要求 Claude 创建队友后队友没有出现：

* 在 in-process 模式中，队友出现在提示输入下方的代理面板中。使用上下箭头键选择一个，然后按 Enter 键查看它。
* 闲置后消失的队友行已被隐藏，而不是停止。闲置行在整个面板闲置 30 秒后隐藏，并在队友的下一轮出现时重新出现。当超过三个队友闲置时，他们的多余行会折叠成一个 `N idle agents` 行，按 Enter 键可展开。按名称向队友发送消息以将隐藏的行恢复。
* 检查你给 Claude 的任务是否足够复杂以保证需要团队。Claude 根据任务决定是否生成队友。
* 如果你明确要求分割窗格，请确保 tmux 已安装并在你的 PATH 中可用：

  ```bash
  which tmux
  ```

* 对于 iTerm2，验证 `it2` CLI 已安装，并在 iTerm2 偏好设置中启用了 Python API。

<a id="too-many-permission-prompts"></a>

### 过多权限提示

队友权限请求冒泡到负责人，这可能会造成摩擦。在生成队友之前，在你的 [权限设置](https://code.claude.com/docs/zh-CN/permissions) 中预批准常见操作，以减少中断。

<a id="teammates-stopping-on-errors"></a>

### 队友在错误后停止

队友可能在遇到错误后停止，而不是恢复。通过在代理面板中选择队友并在 in-process 模式中按 Enter 键，或在分割模式中点击窗格来检查他们的输出，然后：

* 直接给他们额外的指示
* 生成一个替代队友来继续工作

<!-- min-version: 2.1.198 -->

从 v2.1.198 开始，来自负责人或另一个队友的消息会唤醒正在等待重试失败 API 请求的 in-process 队友，因此它会立即重试，而不是等待完整的重试延迟。

<a id="lead-shuts-down-before-work-is-done"></a>

### 负责人在工作完成前关闭

负责人可能会在所有任务实际完成之前决定团队已完成。如果发生这种情况，告诉它继续。你也可以告诉负责人在继续之前等待队友完成，如果它开始做工作而不是委派。

<a id="orphaned-tmux-sessions"></a>

### 孤立的 tmux 会话

如果 tmux 会话在 Claude Code 会话结束后仍然存在，它可能没有被完全清理。列出会话并杀死由团队创建的会话：

```bash
tmux ls
tmux kill-session -t <session-name>
```

<a id="limitations"></a>

## A7. 限制

Agent teams 是实验性的。需要注意的当前限制：

* **In-process 队友没有会话恢复**：`/resume` 和 `/rewind` 不会恢复 in-process 队友。恢复会话后，负责人可能会尝试向不再存在的队友发送消息。如果发生这种情况，告诉负责人生成新队友。
* **任务状态可能滞后**：队友有时无法将任务标记为已完成，这会阻止依赖任务。如果任务似乎卡住，检查工作是否实际完成，并手动更新任务状态或告诉负责人推动队友。
* **关闭可能很慢**：队友在关闭前完成他们的当前请求或工具调用，这可能需要时间。
* **每个会话一个团队**：一个会话恰好有一个团队，作用域限于该会话。你无法创建额外的命名团队或在会话间共享团队。
* **没有嵌套团队**：队友无法生成自己的队友。只有负责人可以管理团队。
* **没有来自 in-process 队友的后台子代理**：in-process 队友自己的子代理在前台运行。无论是使用 `run_in_background` 还是设置 `background: true` 的子代理定义，请求后台子代理都会返回错误，因为队友的后台工作无法超越负责人的进程。从主对话启动的子代理遵循[后台默认值](https://code.claude.com/docs/zh-CN/sub-agents#run-subagents-in-foreground-or-background)。
* **负责人是固定的**：主会话在其生命周期内是其团队的负责人。你无法将队友提升为负责人或转移领导权。
* **权限在生成时设置**：所有队友从负责人的权限模式开始。你可以在生成后更改个别队友模式，但在生成时无法设置每个队友的模式。
* **分割窗格需要 tmux 或 iTerm2**：默认 in-process 模式在任何终端中工作。VS Code 的集成终端、Windows Terminal 或 Ghostty 不支持分割窗格模式。

> [!TIP]
> **`CLAUDE.md` 正常工作**：队友从他们的工作目录读取 `CLAUDE.md` 文件。使用这个为所有队友提供项目特定的指导。

<a id="next-steps"></a>

## A8. 后续步骤

探索用于并行工作和委派的相关方法：

* **轻量级委派**：[subagents](https://code.claude.com/docs/zh-CN/sub-agents) 在你的会话中生成辅助代理以进行研究或验证，更适合不需要代理间协调的任务
* **手动并行会话**：[Git worktrees](https://code.claude.com/docs/zh-CN/worktrees) 让你自己运行多个 Claude Code 会话，无需自动化团队协调
* **比较方法**：查看 [subagent vs agent team](https://code.claude.com/docs/zh-CN/features-overview#compare-similar-features) 比较以获得并排分解

---

<a id="appendix-openai-swarm"></a>

# 附录 B：OpenAI Swarm 官方说明与概念校准

> **主要来源：** [OpenAI Swarm 官方仓库与 README](https://github.com/openai/swarm)、[Swarm 核心运行代码](https://github.com/openai/swarm/blob/main/swarm/core.py)、[OpenAI Agents SDK 多 Agent 编排文档](https://openai.github.io/openai-agents-python/multi_agent/)。
>
> **资料状态：** `openai/swarm` 是 MIT 许可的实验性、教学型 Python 框架。OpenAI 已在仓库首页明确说明：它已由面向生产的 OpenAI Agents SDK 取代，生产项目应迁移到 Agents SDK。
>
> **内容形式：** 以下是对官方 README 与源码的结构化中文说明，不是 README 的逐字转载。

### 先校准：“Swarm”在这里有三种不同含义

| 名称 | 实际含义 | 是否等同 |
| --- | --- | --- |
| **OpenAI Swarm** | OpenAI Solutions 团队发布的轻量级多 Agent 教学框架，核心是 `Agent` 与 handoff | 是一个具体代码仓库 |
| **swarm 架构模式** | 泛指一个协调者把任务横向拆开，由多个执行单元并行完成，再汇总结果 | 是通用架构概念，不属于某一家 |
| **Kimi K3 Swarm** | Kimi 的产品与模型入口，官方定义为大规模横向扩展的 Agent Swarm | 是 Kimi 自有产品名称 |

> [!IMPORTANT]
> **不能因为 Codex 和 Kimi 都使用多个 Agent，就认定它们“基于 OpenAI Swarm”。** 截至本次调研，没有找到 OpenAI 或 Kimi 的官方资料说明 Codex、Kimi K3 Swarm 使用了 `openai/swarm` 仓库。它们可以在广义上属于多 Agent 或 swarm 范式，但实现来源不能据此划等号。

### B1. OpenAI 对 Swarm 的官方定位

OpenAI 将 Swarm 定位为一个用于探索多 Agent 编排的轻量级教育资源，设计目标是：

- **轻量**：核心抽象和运行循环都很小，方便开发者理解与修改。
- **可控**：Agent、工具、切换条件和外部上下文由应用代码显式定义。
- **可测试**：开发者可以围绕路由、工具和交接行为自行编写评测。
- **客户端执行**：主要逻辑运行在开发者自己的 Python 进程中。
- **无服务端状态**：底层使用 Chat Completions；每次 `run()` 结束后，框架不会替开发者保存会话状态。

它适合解释“如何让多个专业能力彼此交接”，但不是一套开箱即用的长任务平台、并行 Worker 集群或团队协作产品。

### B2. 两个核心原语：Agent 与 handoff

#### Agent

Swarm 中的 `Agent` 是一组配置，而不是一台长期运行的独立计算节点。它主要封装：

- `name`：Agent 名称；
- `model`：使用的模型；
- `instructions`：固定指令或根据 `context_variables` 动态生成的指令；
- `functions`：可调用的 Python 函数；
- `tool_choice`、`parallel_tool_calls` 等模型调用设置。

官方文档也提醒，Agent 不一定要拟人化为某个“员工”；它同样可以表示一个工作流阶段、一次检索、一个数据转换步骤或一组工具。

#### Handoff

handoff 的实现非常直接：某个 Agent 调用一个 Python 函数，如果该函数返回另一个 `Agent`，运行时就把后者设为新的 active Agent。后续对话由新 Agent 的 instructions 和 functions 接管。

因此，handoff 更像“把当前会话路由给另一个处理者”，而不是“主 Agent 同时生成一批后台队友”。如果同一轮有多个 handoff，官方源码只采用最后一个 Agent 切换结果。

### B3. 官方运行循环

`client.run()` 接收初始 Agent、消息和外部上下文变量，内部循环可概括为：

```text
当前 active Agent 生成一次 completion
              │
              ▼
是否产生函数 / 工具调用？
      ├─ 否 → 返回 Response
      └─ 是 → 执行函数并追加结果
                    │
                    ├─ 函数返回新 Agent → handoff，切换 active Agent
                    ├─ 函数返回新变量 → 更新 context_variables
                    └─ 普通结果 → 写回消息历史
                                      │
                                      └─ 进入下一轮
```

官方列出的循环步骤是：获取当前 Agent 的模型结果、执行工具调用、必要时切换 Agent、必要时更新上下文变量；当没有新的函数调用时返回。

### B4. 状态、返回值与可观测能力

| 能力 | OpenAI Swarm 的实现 |
| --- | --- |
| **消息状态** | `run()` 返回本次新增消息；下一轮要由调用方再次传入 |
| **当前 Agent** | `Response.agent` 返回最后处理消息的 Agent |
| **外部变量** | `Response.context_variables` 返回更新后的字典 |
| **持久化** | 框架不保存；数据库、线程、记忆和恢复由应用方实现 |
| **轮次限制** | 支持 `max_turns` |
| **模型覆盖** | 支持 `model_override` |
| **工具执行开关** | `execute_tools=false` 时可把工具调用交还给上层处理 |
| **流式输出** | 支持 streaming，并增加 Agent 轮次边界事件 |
| **调试** | 支持 debug 日志 |
| **评测** | 官方鼓励自带 eval suite，并提供少量示例 |

### B5. 它没有开箱提供什么

`openai/swarm` 的名称很容易让人联想到“大规模并行蜂群”，但官方 README 和源码没有提供以下产品级运行时：

- 根据任务复杂度动态决定并生成 N 个 Worker 的集群调度器；
- 子 Agent 并发池、队列、背压、配额和并发上限管理；
- DAG、共享任务表、任务认领、依赖解除和失败重排；
- 多个长期存活且彼此直接通信的 Agent Session；
- 共享 workspace、worktree、文件锁或冲突合并；
- 固定的 Verifier、质量门、自动返工和人工审批；
- 服务端会话、长期记忆、断点恢复、权限沙箱和审计控制面。

`Agent.parallel_tool_calls` 可以允许当前模型一次提出多个函数调用，但核心源码仍在本地循环中逐个处理这些调用；这不等于同时运行多个独立 Agent。并行执行、持久化和生产治理需要应用方另行实现。

### B6. 与 OpenAI Agents SDK 的关系

OpenAI 已将 Agents SDK 定义为 Swarm 的生产级演进。Agents SDK 把多 Agent 编排分为两个维度：

- **由 LLM 决策**：模型根据任务自行选择工具、专业 Agent 和 handoff。
- **由代码编排**：应用代码明确规定执行顺序、并行方式和汇总逻辑。

常见的两个 SDK 模式是：

- **Agents as tools**：Manager 保持用户会话控制权，把专业 Agent 当作工具调用，再统一汇总。
- **Handoffs**：Triage Agent 把当前处理权交给专业 Agent，由后者直接接管后续交互。

研发如果要新建生产系统，应把 `openai/swarm` 当作理解 handoff 的参考实现，把 Agents SDK 作为当前的官方生产入口。

### B7. Codex 与 Kimi K3 Swarm 应如何归类

| 产品 | 官方公开的实际形态 | 与 `openai/swarm` 的关系 |
| --- | --- | --- |
| **OpenAI Codex / ChatGPT Work Subagents** | 主线程可生成专业 Subagent 并行处理独立任务，再把摘要收回主响应；当前 Codex 版本默认具备该能力，用户可直接要求委派，也可由 `AGENTS.md` 或 Skill 触发 | 官方没有说明其基于 `openai/swarm`；属于广义的“协调 Agent + 并行 Subagent”工作流 |
| **OpenAI Codex app 多任务层** | 多个 Agent 还可以运行在独立任务线程与 worktree 中，由用户跨线程分派、查看 diff 和监督 | 同样没有官方归因到 `openai/swarm`；这一层更接近“人工监管的并行 Agent 控制台” |
| **Kimi K3 Swarm** | 主协调器自动拆解任务并调度最多 300 个子 Agent，面向大规模检索与批处理；官方称采用 PARL 训练协调器 | 官方没有说明其基于 `openai/swarm`；更接近通用意义上的动态 fan-out / fan-in swarm |

对应官方资料：

- [OpenAI：Codex / ChatGPT Work Subagent workflows](https://developers.openai.com/codex/agent-configuration/subagents)
- [OpenAI：Codex app 以独立线程和 worktree 管理多个并行 Agent](https://openai.com/index/introducing-the-codex-app/)
- [Kimi：Agent Swarm / K3 Swarm 官方帮助](https://www.kimi.com/help/agent/agent-swarm)
- [Kimi：K3、K3 Swarm 使用入口与适用场景](https://www.kimi.com/help/getting-started/agentic-chat)

一句话结论：

> **若“Swarm”指通用的协调者拆分任务并并行调用执行单元，Codex Subagent workflows 与 Kimi K3 Swarm 都可以归入这个大类；但 Kimi 更强调最多 300 个子 Agent 的横向扩展，Codex 还叠加了人类管理线程与 worktree 的控制台。若“Swarm”特指 `openai/swarm` 仓库，则目前没有官方证据表明二者采用了该实现。**

### B8. 知乎解释帖：适合作为入门导读，但要补充时效与边界

> **第三方来源：** 知乎文章《[OpenAI 开源多模态智能体（AI Agent）Swarm 详解](https://zhuanlan.zhihu.com/p/1913647615167428379)》，作者 AITransformer，发布于 2025-06-04。
>
> **证据等级：** 第三方技术解释。本文可帮助研发快速理解代码与概念，但产品状态、能力边界和框架对比仍应以 OpenAI 当前官方文档及源码为准。

这篇文章对 Swarm 的介绍主要包括：

- 将 Swarm 概括为轻量、可控、面向教育和实验的多 Agent 协作框架，而非生产环境框架；
- 介绍 Swarm Client、Agent、Response、Result 四类对象，以及 instructions、functions、context variables；
- 用“Agent A 通过函数返回 Agent B”的示例解释 handoff；
- 用动态 instructions 示例解释 context variables；
- 把客服分流、退款 / 订单处理、天气查询、航班改签等路由型工作流列为典型场景；
- 在对比图中，把 OpenAI Agents SDK 描述为支持 Agent 交接、Agent-as-tool、过程记录与安全检查的产品化框架。

其中，下面几条与当前官方资料基本一致：

| 帖子观点 | 官方核验 | 结论 |
| --- | --- | --- |
| Swarm 是实验和教学框架，不适合直接作为生产底座 | Swarm README 明确写明实验性、教育性，并推荐生产项目迁移到 Agents SDK | **成立** |
| Swarm 依赖 Chat Completions，调用之间不保存状态 | README 与源码均如此 | **成立** |
| Agent 通过函数返回另一个 Agent 完成交接 | 这正是 Swarm 的 handoff 核心机制 | **成立** |
| context variables 可影响动态 instructions 和工具行为 | README 与核心代码均支持 | **成立** |
| 客服分流和固定工作流是典型用例 | 官方示例集中在 triage、airline、support、weather、personal shopper 等场景 | **成立** |

有几处需要研发在引用时加限定：

| 帖子 / 配图表述 | 需要补充的边界 |
| --- | --- |
| 标题称“多模态智能体 Swarm” | “多模态”不是 OpenAI 对该仓库的核心定位；仓库重点是 Agent、工具和 handoff 编排。是否支持某种模态取决于底层模型、API 和应用传参。 |
| “约 500 行”“完全透明” | 代码规模是文章当时的近似口径，会随版本和统计方式变化；debug 日志有助于理解本地循环，但不等于生产级 tracing、审计与完整可观测性。 |
| Agents SDK 中多个 Agent “通常按顺序接力，天然并行能力有限” | 这可以描述最简单的 handoff 链，但不是 SDK 硬限制。当前官方文档明确支持由代码使用 `asyncio.gather` 并行运行多个 Agent。 |
| Agents SDK 的 Agent “在同一套框架内运行，隔离性较弱” | 对普通文本 Agent 可以这样理解；但当前 SDK 已提供 Sandbox Agent、真实隔离 workspace 与可恢复 sandbox session，因此这条判断已经部分过时。 |
| Agents SDK “不适合大规模独立任务执行” | SDK 没有像 Kimi K3 Swarm 那样开箱提供自动扩容到数百 Worker 的托管调度器，这一判断仍有参考价值；但开发者可以自行用并发、队列和分布式执行系统扩展。 |

因此，这篇知乎帖适合解释 Swarm 的基本对象、handoff 和示例代码；但它发布于 2025 年 6 月，而当前 Agents SDK 已新增或强化并行编排、Sandbox Agent、Session、人工审批、MCP 和 tracing 等能力。研发做现行选型时，不能只依据帖子中的对比图。

### B9. Agents SDK 与 Codex 的关系：官方后继不等于 Codex 内部实现

先给结论：

> **Agents SDK 确实是 OpenAI 面向开发者提供的 Swarm 生产级后继，但截至 2026-07-26，没有官方证据表明 Codex 是基于 OpenAI Agents SDK 实现的。更准确的说法是：二者共享一部分 Agent 设计思想，也都可以使用 Responses API，但 Codex 有自己独立的 Codex harness、Codex core 和 App Server 运行时。**

三者的关系更接近：

```text
                         OpenAI Responses API
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
       OpenAI Agents SDK                    Codex harness
   开发者构建 Agent 应用的框架        OpenAI 自有编码 Agent 运行时
   Agent / tools / handoff /              Codex core / threads /
   guardrails / sessions / tracing         sandbox / App Server
                 │                                 │
                 └── 可通过 MCP 调用 Codex ────────┘
```

#### 为什么不能直接说“Codex 现在用的就是 Agents SDK”

1. **官方对 Agents SDK 的定位不同。** OpenAI 将它定义为供开发者构建 Agent 应用的生产级框架，是 Swarm 的正式升级版；其 OpenAI 模型默认通过 Responses API 运行。
2. **官方对 Codex 的定位是独立 harness。** OpenAI 的 Codex 架构文章说明，所有 Codex 体验由同一套 Codex harness 驱动；Agent loop、线程持久化、配置认证、工具执行、sandbox、MCP 与 Skill 等逻辑位于 `Codex core`。
3. **Codex 的产品接口是 App Server。** 桌面端、IDE 和 Codex Web 通过 Codex App Server 驱动这套 harness；Codex Web 会在容器中启动 App Server 二进制，而不是公开描述为启动 Agents SDK Runner。
4. **官方把二者描述为可组合组件。** Codex App Server 文章明确举例：Agents SDK 可以作为 MCP Client 连接 `codex mcp-server`，把 Codex 当成可调用工具。如果 Codex 本身只是 Agents SDK 的一个普通实例，官方通常不会用这种“SDK 调 Codex”的集成关系来描述二者。
5. **公开代码也支持“独立运行时”判断。** `openai/codex` 的公开核心是 Rust workspace，包含自己的 `core`、`agent-graph-store`、`thread-store`、`app-server` 和 `responses-api-proxy` 等模块；这至少说明公开的 Codex CLI / harness 不是对 Python 或 TypeScript Agents SDK 的简单封装。未公开的服务端组件仍不能由外部材料完全反推。

#### 可以说什么，不能说什么

| 表述 | 是否建议写入研发文档 | 原因 |
| --- | --- | --- |
| “Agents SDK 是 OpenAI Swarm 的生产级后继。” | **可以** | Agents SDK 官方首页与 Swarm README 明确说明 |
| “OpenAI 当前建议开发者用 Agents SDK 构建生产级多 Agent 应用。” | **可以** | 这是面向外部开发者的官方迁移建议 |
| “Agents SDK 与 Codex 都可使用 Responses API。” | **可以，但要说明只是共用底层 API** | 共用 API 不代表共用运行时 |
| “Codex Subagent workflow 与 Agents SDK manager / agent-as-tool 模式很像。” | **可以作为架构类比** | 二者都有主线程、专业 Agent、并行执行和结果汇总 |
| “Codex 现在使用 Agents SDK 作为内部 Agent Team 引擎。” | **不要这样写** | 没有官方证据；公开架构反而指向独立 Codex harness / Codex core |
| “Codex 是 OpenAI Swarm 升级后的产品形态。” | **不要这样写** | Swarm → Agents SDK 是框架演进关系；Codex 是另一条编码 Agent 产品与运行时路线 |

对应官方资料：

- [OpenAI Agents SDK 官方总览](https://openai.github.io/openai-agents-python/)
- [OpenAI Agents SDK：多 Agent 编排与并行方式](https://openai.github.io/openai-agents-python/multi_agent/)
- [OpenAI：Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)
- [OpenAI：Codex harness 与 App Server 架构](https://openai.com/index/unlocking-the-codex-harness/)
- [OpenAI Codex 开源仓库](https://github.com/openai/codex)
- [Codex Rust workspace 清单](https://github.com/openai/codex/blob/main/codex-rs/Cargo.toml)

研发侧推荐采用下面这句话：

> **OpenAI Agents SDK 是 `openai/swarm` 面向生产场景的官方后继；Codex 则由独立的 Codex harness / Codex core 驱动。Codex 的 Subagent workflow 与 Agents SDK 的 Manager + specialist Agent 编排在架构上相似，但目前没有官方证据证明 Codex 内部以 Agents SDK 为运行时。**

---

<a id="appendix-minimax-agent-team-summary"></a>

# 附录 C：MiniMax Agent Team 官方文章第 3 节之后摘要

> **来源：** MiniMax 官方文章《[MiniMax Agent Team：为长程任务，持续进化而生](https://www.minimaxi.com/blog/minimax-agent-team-long-running-1779893521)》，2026-04-27。
>
> **摘要范围：** 从原文第 3 节“MiniMax Agent Team：在约束多 Agent 循环的基础上，给予每个 Agent 更高的自由度”至文末，正是截图所示标题之后的内容。
>
> **证据边界：** 下文是对厂商设计说明的结构化摘要，不代表独立第三方验证；未公开的并发、调度、重试和权限参数仍标为未知。

### C1. 产品定位

MiniMax 将 Agent Team 描述为一种由主 Agent 牵头的长程多 Agent 系统：主 Agent 把复杂目标拆成可并行子任务，由多个 Agent 并发执行，再通过独立验证角色设置对抗式质量门禁。模型负责有弹性的任务执行，但外部代码和状态机负责约束循环。

其基本思想来自 Ralph Loop 与 Coding Harness：大模型上下文是稀缺资源，应通过任务拆分、职责分类和 Context 隔离，让每个角色只处理与自身职责有关的信息，降低长任务中的上下文污染。

### C2. Leader、Worker、Verifier

| 角色 | 主要职责 | 关键产物 / 决策 |
| --- | --- | --- |
| **Leader** | 把用户目标变成任务结构；判断是否值得启动 Team；决定粒度、并行、重试与人工升级 | 任务图、状态判断、最终聚合 |
| **Worker** | 执行检索、代码、写作等具体子任务；可拥有不同工具、Context、Skill 和输出规范 | 可复用、可比较的中间产物 |
| **Verifier** | 检查来源、覆盖度、测试证据、风险和交付标准；可以退回修改 | 验收结论、缺陷反馈、返工要求 |

Worker 与 Verifier 被设计成对抗关系：Worker 提交完成结果会触发 Verifier；验证失败再触发 Worker 返工。它不是一次性的“主 Agent 调工具”，而是持续的生产—验证循环。

### C3. Team Engine 状态机

MiniMax 用 Team Engine 管理每个 Agent Session 和任务状态：

```text
producing ──→ verifying ──→ done
    ▲              │
    └── 验证失败 ──┘
```

- `producing`：Worker 或专业角色生产结果；
- `verifying`：Verifier、Tester、Reviewer 或 Evaluator 执行验收；
- `done`：满足验收标准后结束；
- 验证未通过时，Team Engine 重新唤起生产节点继续修改。

Leader 能接收状态推送、主动查询任务细节，也能向仍在运行的 producing / verifying Agent 补充 Prompt。因此协作是多轮、可打断、可继续的 Session，而不是一次调用与一次返回。

### C4. 上下文、记忆与通信

官方文章介绍了五类信息载体：

- **交接文件**：将阶段成果整理为下游 Agent 可消费的中间件；
- **共享留言板 / 白板文件**：保存容量更大的团队信息，由其他 Agent 按需读取；
- **路径加摘要**：以文件路径和简短摘要进行非打断式“慢通信”，避免整份材料重复进入 Context；
- **Agent 间通信 CLI**：运行节点之间可直接对话，用于需要即时打断的沟通；
- **记忆与 Skill**：把本次经验沉淀给未来任务，也可通知正在执行的同类 Agent。

MiniMax 进一步把用户可执行的 `prompt`、`spawn`、`abort`、`kill` 等动作抽象成统一接口，调用者可以是用户、其他 Agent 或 Team Engine。所谓“Agent 与人类同权”更准确地说是共享同一类可审计控制接口，并不代表 Agent 拥有无限权限。

### C5. 四类核心场景

#### IM 异步长任务

主 Agent 先快速确认任务并保持前台可对话，后台团队继续分钟级或小时级执行。用户可以追加要求、查询进度或处理其他话题；任务状态、事件日志、文件和决策记录应保存在模型 Context 之外，成为可恢复对象。

#### Coding Harness

常见分工是 Leader、Developer、Tester、Reviewer：

- Developer 实现并说明修改理由、风险和验证建议；
- Tester 通过测试、命令和可执行检查提供 tool-grounded 证据；
- Reviewer 检查抽象边界、兼容性、错误处理、权限扩张、敏感日志和业务语义；
- test、lint、build、format check、diff、沙箱和审查记录构成外部停止条件。

#### 并行检索与研究

多个 Agent 从不同方向收集证据，再由 Verifier 和 Synthesizer 检查与合并。Verifier 关注来源能否复查、URL 是否稳定、信息是否过期，以及是否存在反面证据；搜索缓存和聚合页面只作为线索。

#### 流水线式办公文档

Planner、Writer、Formatter、Evaluator 分别负责结构、正文、版式与文件对象、内容和文件完整性。每一阶段形成可检查的中间产物，失败时局部返工，整体接近文档领域的 CI/CD。

### C6. 三类上下文成本

| 成本 | 含义 | 文章给出的缓解方式 |
| --- | --- | --- |
| **交接成本** | 上游材料必须重新组织成下游角色可消费的内容 | 交接文件、路径加摘要 |
| **共享成本** | 同一信息广播给所有 Agent，会在每个 Agent 每轮重复付 Token | 记忆、按需白板、必要时即时通信 |
| **聚合成本** | 并行获得多份结果容易，统一事实、引用和风格很难 | Leader 专门负责收敛与合成 |

### C7. 验证、重试与人类责任

- **验证有成本**：代码要真正跑测试，研究要核来源，文档要验内容与文件完整性。
- **重试可能失控**：如果验收标准和停止条件模糊，Worker 与 Verifier 会陷入持续返工。
- **Leader 决策不能含糊**：合并代码、覆盖线上数据等高风险动作，最终仍需要人类签字。
- **过程必须透明**：用户愿意等待更长的任务，前提是结果可验证、过程可恢复、轨迹可审计。

### C8. 官方文章的最终判断

MiniMax 把 Agent Team 视为 **runtime，而不是 Prompt 模板**。真实系统必须管理任务状态、事件、消息来源、权限、记忆、文件、可观测性和界面呈现。

Team 也不应成为所有任务的默认选项：

- 任务复杂、链路长、风险高、可并行且经验可复用时，更值得使用 Team；
- 任务短、低风险、结果确定时，单 Agent、脚本或传统自动化通常更便宜；
- 判断系统价值要看为什么拆分、如何验收、何时停止、失败如何恢复和记忆如何管理，而不是只看 Agent 数量。

文章发布时表示 MiniMax Agent 后续计划开源；这只是当时的计划，不能直接等同于当前编排运行时已完整开源。

### C9. 仍未公开的工程参数

该文章没有披露：

- 单个 Team 的最大 Agent 数与同时活跃并发；
- Leader 的组队阈值和成员选择算法；
- 默认重试上限、超时、预算熔断与降级策略；
- Worker 的进程、容器或操作系统级隔离方式；
- 跨会话恢复的一致性保证；
- 详细权限模型、审计字段与 SLA；
- 相同任务、模型和预算下相对单 Agent 的受控 A/B 数据。

研究归纳：

> **MiniMax Agent Team 的中心不是“尽可能多地扩容 Agent”，而是以 Team Engine 状态机组织并行 Worker，通过独立 Verifier、失败返工、上下文隔离、长期记忆和人工门禁，把多 Agent 变成长程任务的受控运行时。**

---

<a id="appendix-three-way-comparison"></a>

# 附录 D：OpenAI Swarm、Claude Code Agent Teams、MiniMax Agent Team 对比

> **比较边界：** 三者并非同层产品。OpenAI Swarm 是开发框架和参考实现；Claude Code Agent Teams 是编码工具中的实验性团队运行时；MiniMax Agent Team 是面向编码、研究和办公长任务的产品运行时。下表比较的是机制边界，不是统一基准下的性能排名。

### D1. 三条路线的一句话差异

```text
OpenAI Swarm
Agent + tools + handoff 的无状态路由循环

Claude Code Agent Teams
Lead + 独立队友会话 + 共享任务表 + P2P 消息

MiniMax Agent Team
Leader + 并行 Worker + Verifier + Team Engine 返工状态机
```

### D2. 详细对比

| 维度 | OpenAI Swarm | Claude Code Agent Teams | MiniMax Agent Team |
| --- | --- | --- | --- |
| **产品层级** | 开源 Python 教学框架 | Claude Code 内置实验功能 | MiniMax Code / Agent 产品能力 |
| **当前状态** | 已由 OpenAI Agents SDK 取代；不建议新生产项目直接采用 | 默认关闭，需实验开关 | 已产品化；具体权益与版本随客户端更新 |
| **核心目标** | 低成本表达专业 Agent 路由与交接 | 让多个完整 Claude Code 会话作为开发团队协作 | 让复杂长任务进入生产—验证—返工闭环 |
| **基本拓扑** | 当前 Agent 通过函数 handoff 切换到另一个 Agent | 固定 Lead + 多个 Teammate；共享任务表，支持队友直连 | Leader + Worker + Verifier；Team Engine 管理状态 |
| **谁定义团队** | 应用开发者在代码中定义 Agent、函数和 handoff | 用户可明确指定人数、角色与模型；Claude 也可建议组队，经用户确认 | Leader 可判断是否组队；产品也支持创建角色和团队 |
| **是否原生动态扩容** | 否；没有自动生成 N 个后台 Agent 的调度器 | Lead 可按任务生成队友，但不能嵌套团队 | 官方描述 Leader 拆分并调度多个 Agent；算法与阈值未公开 |
| **并发方式** | 不提供 Agent 并发池；工具调用由核心循环处理 | 多个独立 Claude Code 实例并行运行 | 多个 Worker 并发，生产与验证也可形成循环 |
| **公开规模** | 没有“子 Agent 上限”概念 | 无硬上限；官方建议多数流程从 3–5 名队友开始 | 未公布单队成员和并发硬上限 |
| **任务状态** | 消息、active Agent、context variables 由调用方保存 | 本地共享任务列表，含待处理、进行中、完成和依赖 | Team Engine 明确管理 producing、verifying、done |
| **Agent 间通信** | handoff 与工具结果；本质是切换 active Agent | Mailbox、共享任务表、队友之间直接发消息 | 通信 CLI、共享留言板 / 白板、文件路径与摘要 |
| **Context 模型** | 同一消息历史配合不同 Agent instructions；调用间无状态 | 每名队友独立 Context Window；加载项目 Context，不继承 Lead 对话历史 | 按角色和任务隔离 Context；结合记忆、Skill 和外部制品 |
| **质量机制** | 无固定 Verifier；评测、校验和重试由开发者实现 | 可用 plan approval、hooks、测试和用户指导，但无固定验证角色 | Verifier 是核心角色；不通过则自动回到 producing |
| **结束条件** | 无新函数调用或达到 `max_turns` | Lead 判断任务完成；任务状态与 hooks 可施加约束 | Verifier 通过后进入 done；高风险动作升级给人类 |
| **用户中途干预** | 取决于上层应用；框架本身面向开发者 | 用户可直接查看、消息、打断、分配和关闭具体队友 | 用户可持续与 Leader 交互；控制接口可由人、Agent、引擎调用 |
| **持久化与恢复** | 不提供，完全由应用实现 | 团队限于单会话；任务目录可保留，但 in-process 队友恢复存在限制 | 强调 Session、外部状态和长任务；具体恢复保证未公开 |
| **Workspace** | 不提供 | 队友共享工作目录，编辑同一文件存在覆盖风险 | 使用交接文件、白板和 Harness；系统级隔离粒度未公开 |
| **可观测性** | streaming、debug、Response；生产 tracing 应转 Agents SDK | Agent 面板、队友记录、任务列表、消息与 hooks | Team Engine 状态、消息、事件和制品在产品界面呈现 |
| **权限与人工门禁** | 由应用开发者实现 | 权限从 Lead 继承；提示回到 Lead；可要求计划批准 | 强调可审计控制面，高风险合并或数据覆盖需人工决定 |
| **成本结构** | 取决于调用次数、模型和应用编排 | 每个队友独立消耗 Context 与 Token，人数增加会放大成本 | 验证、返工、交接、共享和聚合都会增加 Token 与时间 |
| **透明度** | 源码开放，机制简单；但生产能力需要自建 | 运行时闭源，团队机制与限制文档较详细 | 编排闭源；官方披露角色、状态机和成本，但关键参数未公开 |
| **最适合** | 学习 handoff、原型化路由、构建轻量专业 Agent 网络 | 并行代码审查、竞争假设调试、跨模块开发 | 长程编码、研究、IM 异步任务和正式文档流水线 |

### D3. 三者工作流对照

#### OpenAI Swarm：路由 / handoff

```text
用户消息
   ↓
Agent A ──调用函数──→ 工具结果
   │
   └──函数返回 Agent B──→ 切换 active Agent
                              ↓
                         继续同一消息循环
```

重点是“当前由谁处理”，不是同时维护一支持久队伍。

#### Claude Code Agent Teams：协作团队

```text
用户 ↔ Team Lead
          │
          ├──共享任务表── Teammate A
          ├──共享任务表── Teammate B
          └──共享任务表── Teammate C
                ↕              ↕
              Mailbox / P2P 消息
```

重点是独立成员、共享任务和彼此通信；质量依赖角色设计、任务边界、测试、hooks 与人工指导。

#### MiniMax Agent Team：受控生产闭环

```text
用户 ↔ Leader
          │
          ▼
      Team Engine
          │
          ├── Worker：producing
          │        │
          │        ▼
          └── Verifier：verifying
                   ├─ 通过 → done
                   └─ 失败 → Worker 返工
```

重点是状态机、独立验证和返工，使长任务不只并行，而且可验收。

### D4. Codex和Kimi swarm的对比

- **可以确定的部分**：如果“swarm 模式”只是泛指主协调者拆分任务、多个执行单元并行执行，那么 Codex Subagent workflows 和 Kimi K3 Swarm 都属于这个大类。Codex 官方明确写明主线程可并行生成专业 Subagent 并收集结果；Kimi 则把这种模式进一步扩展到最多 300 个子 Agent。
- **Kimi 的归属**：Kimi 官方将 K3 Swarm 描述为 PARL 训练的自设计组织结构，由主协调器调度最多 300 个子 Agent；不能说它基于 OpenAI Swarm，但是二者确实有一定的相似之处。
- **Codex 的归属**：Codex 同时有“主线程生成并汇总 Subagent”的执行层，以及“独立线程、worktree、用户监督”的控制台层。



# 附录 E：研发选型建议（几种agent合作方式的对比）

- 如果目标是理解最小 handoff 原理，可以阅读 OpenAI Swarm；新生产实现应优先评估 OpenAI Agents SDK。
- 如果目标是让几个编码 Agent 互相分享发现、认领任务并接受用户直接指导，Claude Code Agent Teams 更贴近需求。
- 如果目标是分钟级到小时级长任务，并要求独立验收、失败返工和持续状态，MiniMax 的 Team Engine 思路更完整。
- 如果目标是数十到数百个彼此相对独立的检索或批处理子任务，应研究 Kimi K3 Swarm 这类横向扩展系统，而不是把 `openai/swarm` 当成现成并发引擎。
- 无论选哪条路线，生产系统仍需补齐预算、并发、幂等、任务依赖、超时、权限、工作区隔离、可观测性与人工接管。

# 附录 F： 本组附录的官方来源

- [OpenAI Swarm GitHub](https://github.com/openai/swarm)
- [OpenAI Swarm 核心运行代码](https://github.com/openai/swarm/blob/main/swarm/core.py)
- [OpenAI Agents SDK：Agent orchestration](https://openai.github.io/openai-agents-python/multi_agent/)
- [OpenAI：Codex / ChatGPT Work Subagents](https://developers.openai.com/codex/agent-configuration/subagents)
- [OpenAI：Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)
- [OpenAI：Codex harness 与 App Server 架构](https://openai.com/index/unlocking-the-codex-harness/)
- [OpenAI：Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- [Claude Code：Agent Teams 官方中文文档](https://code.claude.com/docs/zh-CN/agent-teams)
- [Kimi：Agent Swarm / K3 Swarm](https://www.kimi.com/help/agent/agent-swarm)
- [Kimi：K3 与 K3 Swarm 使用说明](https://www.kimi.com/help/getting-started/agentic-chat)
- [MiniMax Agent Team 官方文章](https://www.minimaxi.com/blog/minimax-agent-team-long-running-1779893521)
