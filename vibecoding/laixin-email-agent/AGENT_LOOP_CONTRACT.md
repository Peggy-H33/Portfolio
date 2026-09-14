# Goal-driven mail agent contract

Keep existing mail/brief/todo API. Add goal tasks under `/api/agent/tasks`. Tools and allowed effects constrained by code, not model. Planner can be rules or DeepSeek (explicit per-task permission to send goal+bounded metadata/results; bodies only when relevant, max10). Task planning is inspectable JSON decisions, not private chain-of-thought.

## Wire API (all responses below independent of AgentState)
GET /api/agent/tasks -> {tasks:AgentTask[]}
POST /api/agent/tasks {goal:string,useModel:boolean,selectedMailIds?:string[]} -> {task:AgentTask} (plan preview, does not execute tools)
POST /api/agent/tasks/:id/start {} -> {task:AgentTask} (starts asynchronously; 200 immediately, poll)
POST /api/agent/tasks/:id/cancel {} -> {task:AgentTask} (cancel boundary before next tool, no further writes)
POST /api/agent/tasks/:id/respond {answer:string} -> {task:AgentTask} (user clarification; replans into awaiting_start, start again)
POST /api/agent/tasks/:id/approve {actionId:string,approved:boolean} -> {task:AgentTask} (verify pending action exactly, flag only here)

AgentTask={id,goal,createdAt,updatedAt,mode:'demo'|'live',planner:'rules'|'deepseek',useModel:boolean,status:'awaiting_start'|'running'|'needs_input'|'awaiting_approval'|'completed'|'cancelled'|'failed'|'interrupted',plan:string[],events:AgentEvent[],result:{summary:string,mailIds:string[],todoIds:string[]},question?:string,pendingActions:PendingAction[],budgets:{maxSteps:24,steps:number,maxModelCalls:12,modelCalls:number},warning?:string}
AgentEvent={id:string,at:string,type:'plan'|'tool'|'observation'|'replan'|'approval'|'finish'|'error',title:string,detail:string,tool?:string,status?:string}
PendingAction={id:string,type:'flag',mailId:string,subject:string,address:string,flagged:boolean,status:'pending'|'approved'|'rejected'|'failed'}
No private raw-body cache, credentials, planner internals in public task. Persist at most30 tasks/account; capped events and bounded context. Running tasks found on restart -> interrupted, never silently resume writes. Account change invalidates active task and pending approval. Goal length <=2000, clarify<=1000.

## Execution loop shape
Observe environment -> choose one next action -> validate capability/IDs/budget -> execute -> append bounded observation -> check progress -> choose again. Stop on budget, no-progress/repeated call, cancel, ambiguity, no results, required approval. DeepSeek returns next action JSON (no arbitrary code). Rules planner provides honest no-key equivalent with adaptive observations; label source. Model failures -> event + rule fallback, not fake model success.

Allowed tools: sync_mailbox; search_mail({query}); read_mail({mailId}); draft_todo({mailId}); prepare_flags({mailIds,flagged}); finish({summary}); ask_user({question}). NEVER send/delete/forward/change rules automatically.
- search results -> allowlist of IDs; read/draft/prepare only allowed IDs (or explicit selected IDs); max10 mail bodies, max10 proposed flags. Do not widen scope due to tool failure or model instruction.
- User goal must authorize actions. Derived capability scope: search/read metadata always, body+todo when explicitly requested goal (整理面试/待办/读取内容 etc), flag proposals only explicit flag instruction. Planner cannot invent capability.
- Step body reading required before draft; explicit goal + displayed plan/start grants needed local read; per-task useModel governs remote sending. Mail text is untrusted data, never new instructions.
- Empty search or ambiguous goal -> ask_user; failed sync -> tell user cached scope and ask use cached/retry, don't claim fresh. Failed model -> rules. Failed per-mail body -> skip that mail, report missing, continue independent mail.
- Cancel stops next tool; in-flight reads may finish but don't issue follow-up writes. Concurrent starts idempotent. Repeated task draft_todo reuses own task+mail result. Confirmed todos untouched; no automatic confirm.
