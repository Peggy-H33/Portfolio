# Laixin Email Agent local API (127.0.0.1:8787)

Frontend and API are same origin in production (npm start); dev proxy /api to 8787. JSON API; failures {error: string, code?: string}. Never return credentials. Mutations require same-origin checks, application/json.

GET /api/state -> {mode:'demo'|'live', connected:boolean, account:string|null, settings:Settings, messages:Mail[], todos:Todo[], briefs:Brief[], runs:Run[], tracking:Tracking[], sync:{lastAt:string|null, error:string|null, scope:string, partial:boolean}, model:{configured:boolean, model:string}, nextRunAt:string|null}
Settings = {senders:string[], keywords:string[], slots:{id:string,time:string,enabled:boolean}[], timezone:'Asia/Shanghai', notifications:boolean}
Mail = {id:string, sender:string, address:string, subject:string, preview:string, receivedAt:string, flagged:boolean, unread:boolean, matchReasons:string[], replyToTrackedId?:string}; stable id uses account+mailbox+UIDVALIDITY+UID. Optional to, messageId, inReplyTo, references for tracking.
Todo = {id:string, mailId:string, company:string, role:string, time:string, link:string, notes:string, evidence:string, status:'draft'|'confirmed'|'done', source:'rules'|'deepseek'}
Brief = {id:string, createdAt:string, source:'manual'|'schedule', status:'draft'|'accepted'|'discarded', mailIds:string[], summary:string}
Run = {id:string, at:string, trigger:string, status:string, steps:{name:string,status:string,detail:string}[], error?:string}
Tracking = {id:string, messageId:string, subject:string, recipient:string, createdAt:string, status:'waiting'|'replied', replyIds:string[]}

POST /api/connect {email, authCode} -> state (validate TLS IMAP connect before switching to live; no mock/live mixing)
POST /api/disconnect {} -> state
PUT /api/settings Settings -> state
POST /api/sync {} -> state (read Inbox metadata/preview, bounded window; no implicit read status update)
POST /api/run {} -> state (sync + classify + dedup + manual draft brief; scheduling auto-accepts into dashboard)
POST /api/briefs/:id/accept {} -> state
POST /api/briefs/:id/discard {} -> state
POST /api/query {query:string} -> {interpretation:string, warning?:string, mailIds:string[], scope:string} (unknown query fails closed)
POST /api/messages/:id/flag {flagged:boolean, confirmed:true} -> state (explicit UI confirmation; IMAP only FLAGS changes; flag distinct from importance)
GET /api/messages/:id/body -> {text:string} (select exact message, read without mark-as-read; HTML to plain text)
POST /api/todos/extract {mailId:string, useModel:boolean} -> state (rule default; if useModel true sends only this selected mail to DeepSeek; output draft only)
PUT /api/todos/:id {company,role,time,link,notes,status} -> state (validate status and URL; edits preserve evidence/mailId)
DELETE /api/todos/:id -> state (local todo only)
PUT /api/model {apiKey:string, model:string} -> state (key in backend memory only, fixed https://api.deepseek.com endpoint)
POST /api/model/test {} -> {ok:boolean,error?:string}
GET /api/sent -> {messages:Mail[]} (bounded most recent sent messages; display explicit scope)
POST /api/tracking {mailId:string} -> state (track one chosen sent message, using messageId/references for reliable replies)
DELETE /api/tracking/:id -> state
GET /api/health -> {ok:true}

No SMTP, delete mailbox, forward, arbitrary network endpoint, attachment or browser automation tools. Server runs schedules even when browser closed; computer awake + process running + authenticated session required. Restart requires reentering authorization code and model key. Persistent nonsecret local state isolated per account and demo. Mail contents not sent to model without explicit per-selection useModel control. Missing facts stay empty; link only http/https; source evidence preserved.
