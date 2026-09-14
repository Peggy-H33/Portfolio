import crypto from 'node:crypto';

const MAX_STEPS = 24;
const MAX_MODEL_CALLS = 12;
const MAX_BODIES = 10;
const MAX_EVENTS = 100;
const MAX_TASKS = 30;
const allowedTools = new Set(['sync_mailbox','search_mail','read_mail','draft_todo','prepare_flags','finish','ask_user']);
const now = () => new Date().toISOString();
const uid = (p='evt') => `${p}_${crypto.randomUUID()}`;
const text = v => typeof v === 'string' ? v : '';
const lower = v => text(v).toLowerCase();

function publicTask(task) {
  const copy = structuredClone(task);
  delete copy._runtime;
  return copy;
}

function capabilities(goal) {
  const g = text(goal);
  // Capabilities come only from the user's goal, never from mail text or model output.
  const body = /(正文|内容|原文|阅读|读一下|查看.*邮件|总结|提取|整理.*面试|面试.*整理|待办|to[- ]?do|清单|时间.*公司|岗位.*链接)/i.test(g);
  const todo = /(待办|to[- ]?do|清单|面试.*整理|整理.*面试|提取.*(公司|岗位|时间|链接)|面试安排)/i.test(g);
  const flag = /(红旗|标记.*重要|重要标记|加旗|打旗|flag|标记.*邮件)/i.test(g);
  const unflag = /(取消|去掉|移除|撤销).*(红旗|标记|flag)/i.test(g);
  return {body: body || todo, todo, flag, flagged: flag && !unflag};
}

function queryFor(goal, selected=[]) {
  const g = text(goal).replace(/\s+/g,' ').trim();
  const email = g.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const date = /昨天/.test(g) ? '昨天' : /今天|今日|新邮件|新回复/.test(g) ? '今天' : '';
  let topic = '';
  const quoted = g.match(/[「“"']([^」”"']+)[」”"']/)?.[1];
  const topicMatch = g.match(/(?:主题|标题)(?:包含|含有|是|为)?\s*[「“"']?([^」”"'，,。？?\s]{1,80})/i);
  if (topicMatch) topic = topicMatch[1];
  else if (/面试/.test(g)) topic = '面试';
  else if (/简历|投递|招聘|实习/.test(g)) topic = '招聘';
  else if (quoted && !email && !/(来自|发件|主体)/.test(g)) topic = quoted;
  const chunks = [date];
  if (email) chunks.push(`来自 ${email} 的邮件`);
  else if (topic) chunks.push(`主题包含 ${topic} 的邮件`);
  else if (!selected.length) chunks.push('今天收到的新邮件');
  return chunks.join(' ').trim() || '今天收到的新邮件';
}

function summarizeResult(result) {
  if (result == null) return '工具没有返回结果';
  if (typeof result === 'string') return result.slice(0,500);
  const ids = Array.isArray(result.mailIds) ? `${result.mailIds.length} 封邮件` : '';
  const todo = result.todo?.id || result.id && String(result.id).startsWith('todo_') ? '已生成待办草稿' : '';
  const scope = result.scope ? String(result.scope).slice(0,180) : '';
  return [ids,todo,scope,result.warning].filter(Boolean).join('；') || '工具已返回结构化结果';
}

export function createAgentEngine({getContext, tools, planWithModel, onChange} = {}) {
  if (typeof getContext !== 'function') throw new Error('createAgentEngine 需要 getContext');
  const toolset = tools || {};
  const tasks = new Map();
  const runtimes = new Map();
  let epoch = 0;
  const emit = task => {
    const snapshot = publicTask(task);
    try { const r = onChange?.([...tasks.values()].slice(-MAX_TASKS).map(publicTask)); if (r?.catch) r.catch(()=>{}); } catch {}
    return snapshot;
  };
  const event = (task, type, title, detail, extra={}) => {
    task.events.push({id:uid('evt'),at:now(),type,title,detail:text(detail).slice(0,1200),...extra});
    if (task.events.length > MAX_EVENTS) task.events.splice(0,task.events.length-MAX_EVENTS);
  };
  const contextIdentity = () => { const c=getContext()||{}; return `${c.mode||'demo'}:${c.account||'demo'}`; };
  const taskContext = task => getContext(task.goal, task.selectedMailIds)||{};
  const setStatus = (task,status) => { task.status=status; task.updatedAt=now(); emit(task); };
  const patch = task => { task.updatedAt=now(); emit(task); };
  const addPlan = (task, action) => { const name = action?.tool || action?.action || ''; if(name && !task.plan.includes(name)) task.plan.push(name); };
  const runtimeFor = task => runtimes.get(task.id);

  function create({goal,useModel=false,selectedMailIds=[]}={}) {
    if (typeof goal !== 'string' || !goal.trim() || goal.length > 2000) throw new Error('任务目标需为 1–2000 字');
    const ctx=getContext()||{}; const id=uid('task');
    const task={id,goal:goal.trim(),createdAt:now(),updatedAt:now(),mode:ctx.mode==='live'?'live':'demo',planner:useModel?'deepseek':'rules',useModel:useModel===true,status:'awaiting_start',plan:[],events:[],result:{summary:'尚未执行',mailIds:[],todoIds:[]},pendingActions:[],budgets:{maxSteps:MAX_STEPS,steps:0,maxModelCalls:MAX_MODEL_CALLS,modelCalls:0}};
    const selected=[...new Set((Array.isArray(selectedMailIds)?selectedMailIds:[]).map(String))].slice(0,20);
    task.selectedMailIds=selected;
    const cap=capabilities(task.goal);
    const actionable=/(查|搜|找|有没有|是否|检查|查看|汇报|新邮件|来自|发件|主体|主题|关键词|面试|招聘|投递|简历|待办|红旗|标记|重要|回复|正文|内容|原文|发票|公司|岗位|时间)/i.test(task.goal);
    if (!cap.body && !cap.todo && !cap.flag && !selected.length && !actionable) task.question='请说明要查找的发件人、主题关键词或邮件范围。';
    task.plan=cap.todo?['sync_mailbox','search_mail','read_mail','draft_todo']:cap.flag?['sync_mailbox','search_mail','prepare_flags','等待确认']:actionable?['sync_mailbox','search_mail','finish']:['ask_user'];
    task._runtime={identity:contextIdentity(),cap,phase:'init',searchIds:[],searchMeta:new Map(),readIds:new Set(),todoIds:[],todoMailIds:new Set(),flagIds:[],lastAction:null,repeated:0,cancelled:false,running:false,bodyCount:0,observations:[],failures:{}};
    tasks.set(id,task); runtimes.set(id,task._runtime); delete task._runtime;
    event(task,'plan','计划预览',task.plan.join(' → '));
    if (task.question) { task.status='needs_input'; event(task,'plan','需要补充范围',task.question); }
    emit(task); return publicTask(task);
  }

  function get(id) { const t=tasks.get(id); return t && publicTask(t); }
  function list() { return [...tasks.values()].slice(-MAX_TASKS).map(publicTask); }
  function canRun(task) {
    const rt=runtimeFor(task); if(!rt || rt.cancelled) return false;
    if (rt.identity!==contextIdentity()) { task.warning='邮箱账号或演示/真实模式已改变，任务已停止。'; task.status='interrupted'; event(task,'error','上下文已改变',task.warning); patch(task); return false; }
    if (task.status==='cancelled') return false;
    if (task.budgets.steps>=MAX_STEPS) { task.warning='已达到任务步数上限，停止以避免无限循环。'; setStatus(task,'failed'); event(task,'finish','达到步数上限',task.warning); return false; }
    return true;
  }
  function allowedIds(task) { const rt=runtimeFor(task); return new Set([...rt.searchIds,...task.selectedMailIds]); }
  function validateAction(task, action) {
    const rt=runtimeFor(task), cap=rt.cap;
    let tool=action?.tool || action?.action;
    if (typeof tool!=='string' || !allowedTools.has(tool)) throw new Error('模型选择了未开放的工具');
    const args=(action?.args && typeof action.args==='object')?action.args:{};
    if (tool==='sync_mailbox') return {tool,args:{taskId:task.id}};
    if (tool==='search_mail') return {tool,args:{taskId:task.id,query:queryFor(task.goal,task.selectedMailIds)||'今天收到的新邮件',selectedMailIds:task.selectedMailIds}};
    if (tool==='read_mail') {
      if (!cap.body) throw new Error('当前目标未授权读取邮件正文');
      const mailId=String(args.mailId||''); if(!allowedIds(task).has(mailId)) throw new Error('只能读取本任务搜索或用户选定的邮件');
      if(rt.bodyCount>=MAX_BODIES && !rt.readIds.has(mailId)) throw new Error('正文读取数量已达上限');
      return {tool,args:{taskId:task.id,mailId}};
    }
    if (tool==='draft_todo') {
      if (!cap.todo) throw new Error('当前目标未授权生成待办');
      const mailId=String(args.mailId||''); if(!rt.readIds.has(mailId)) throw new Error('生成待办前必须先读取该邮件正文');
      return {tool,args:{taskId:task.id,mailId,useModel:task.useModel===true}};
    }
    if (tool==='prepare_flags') {
      if (!cap.flagged) throw new Error('当前目标未授权红旗操作');
      const ids=(Array.isArray(args.mailIds)?args.mailIds:rt.searchIds).map(String).filter(id=>allowedIds(task).has(id)).slice(0,10);
      if (!ids.length) throw new Error('没有可供红旗确认的邮件');
      return {tool,args:{taskId:task.id,mailIds:ids,flagged:args.flagged!==false}};
    }
    if (tool==='ask_user') {
      const question=text(args.question||action.question).trim(); if(!question || question.length>1000) throw new Error('澄清问题格式无效'); return {tool,args:{question}};
    }
    if (tool==='finish') { if (rt.phase==='init'||rt.phase==='synced') throw new Error('完成前必须先观察搜索结果'); return {tool,args:{summary:text(args.summary||'任务完成').slice(0,1000)}}; }
    throw new Error('工具参数无效');
  }
  function resultIds(task) { const rt=runtimeFor(task); task.result.mailIds=[...new Set([...task.result.mailIds,...rt.searchIds])].slice(0,100); task.result.todoIds=[...new Set([...task.result.todoIds,...rt.todoIds])].slice(0,100); }
  function metadataFromResult(rt,result) {
    const rows=Array.isArray(result?.messages)?result.messages:[];
    for(const m of rows) if(m?.id) rt.searchMeta.set(String(m.id),{id:String(m.id),subject:text(m.subject).slice(0,200),address:text(m.address).slice(0,160),sender:text(m.sender).slice(0,160),receivedAt:text(m.receivedAt),flagged:m.flagged===true});
  }
  function localPrepareFlags(task, ids, flagged=true) {
    const rt=runtimeFor(task); task.pendingActions=[]; rt.flagIds=[];
    for(const mailId of ids.slice(0,10)) { const m=rt.searchMeta.get(mailId)||{id:mailId}; const action={id:uid('flag'),type:'flag',mailId,subject:m.subject||'邮件',address:m.address||'',flagged,status:'pending'}; task.pendingActions.push(action); rt.flagIds.push(mailId); }
    task.warning='红旗操作尚未执行，逐封等待你的明确确认。'; setStatus(task,'awaiting_approval'); event(task,'approval','等待红旗确认',`${task.pendingActions.length} 封邮件待确认`); patch(task);
  }

  function fallbackPlan(task) {
    const rt=runtimeFor(task), cap=rt.cap;
    if (rt.failures.model) task.warning='DeepSeek 计划失败，已切换为规则计划；没有伪造模型成功。';
    if (rt.phase==='init') return {tool:'sync_mailbox'};
    if (rt.phase==='synced') return {tool:'search_mail'};
    if (rt.phase==='searched') {
      if (!rt.searchIds.length) return {tool:'ask_user',args:{question:'在当前同步范围没有找到匹配邮件。要扩大主题/发件人范围，还是重新同步？'}};
      if (cap.todo) { const id=rt.searchIds.find(x=>!rt.readIds.has(x)); if(id) return {tool:'read_mail',args:{mailId:id}}; const draft=rt.searchIds.find(x=>!rt.todoMailIds.has(x)); if(draft) return {tool:'draft_todo',args:{mailId:draft}}; }
      if (cap.flagged && !task.pendingActions.length && !rt.flagIds.length) return {tool:'prepare_flags',args:{mailIds:rt.searchIds,flagged:true}};
      return {tool:'finish',args:{summary:`已检查 ${rt.searchIds.length} 封匹配邮件${cap.todo?'，待办草稿已生成':''}`}};
    }
    if (rt.phase==='read') {
      const id=rt.searchIds.find(x=>!rt.readIds.has(x)); if(id) return {tool:'read_mail',args:{mailId:id}};
      const draft=rt.searchIds.find(x=>!rt.todoMailIds.has(x)); if(cap.todo&&draft) return {tool:'draft_todo',args:{mailId:draft}};
      if(cap.flagged&&!task.pendingActions.length&&!rt.flagIds.length) return {tool:'prepare_flags',args:{mailIds:rt.searchIds,flagged:true}};
      return {tool:'finish',args:{summary:`已读取并处理 ${rt.searchIds.length} 封匹配邮件`}};
    }
    return {tool:'finish',args:{summary:'任务完成'}};
  }

  async function choose(task) {
    const rt=runtimeFor(task);
    if (task.useModel && typeof planWithModel==='function' && task.budgets.modelCalls<MAX_MODEL_CALLS) {
      task.budgets.modelCalls++; patch(task);
      try {
        const ctx=taskContext(task)||{};
        const observations=rt.observations.slice(-12).map(o=>({type:o.type,title:o.title,detail:o.detail, ...(o.private ? {body:o.private.slice(0,16000)}:{})}));
        const response=await planWithModel({goal:task.goal,tools:[...allowedTools],observations,context:{mode:ctx.mode,account:ctx.account,scope:ctx.scope,modelConfigured:ctx.modelConfigured},remainingBudget:{steps:MAX_STEPS-task.budgets.steps,modelCalls:MAX_MODEL_CALLS-task.budgets.modelCalls}});
        const parsed = typeof response==='string' ? JSON.parse(response.replace(/^```(?:json)?\s*|\s*```$/g,'')) : response;
        const action=parsed?.tool ? parsed : parsed?.action || parsed;
        const valid=validateAction(task,action); addPlan(task,valid); event(task,'plan','下一步计划',valid.tool,{tool:valid.tool,status:'planned'}); patch(task); return valid;
      } catch (e) { rt.failures.model=(rt.failures.model||0)+1; event(task,'error','模型计划失败','已记录失败并切换规则计划',{status:'degraded'}); patch(task); }
    }
    const action=fallbackPlan(task); const valid=validateAction(task,action); addPlan(task,valid); event(task,'plan','规则下一步',valid.tool,{tool:valid.tool,status:'planned'}); patch(task); return valid;
  }

  async function execute(task, action) {
    const rt=runtimeFor(task); if(!canRun(task)) return;
    const key=JSON.stringify(action); if (key===rt.lastAction) rt.repeated++; else {rt.lastAction=key;rt.repeated=0;}
    if(rt.repeated>=3) { task.warning='连续动作没有产生新进展，任务已停止。'; event(task,'error','检测到无进展',task.warning); setStatus(task,'failed'); return; }
    if(action.tool==='ask_user') { task.question=action.args.question; event(task,'plan','需要你的回答',task.question); setStatus(task,'needs_input'); return; }
    if(action.tool==='finish') { task.result.summary=action.args.summary; resultIds(task); event(task,'finish','任务完成',task.result.summary); setStatus(task,'completed'); return; }
    if(action.tool==='prepare_flags') { localPrepareFlags(task,action.args.mailIds,action.args.flagged); return; }
    const fn=toolset[action.tool]; if(typeof fn!=='function') { event(task,'error','工具不可用',`${action.tool} 未接入`); rt.failures[action.tool]=(rt.failures[action.tool]||0)+1; if(rt.failures[action.tool]>=2){task.warning=`${action.tool} 连续失败，等待人工处理。`;setStatus(task,'failed');} return; }
    if(rt.cancelled){setStatus(task,'cancelled');return;}
    task.budgets.steps++; patch(task); event(task,'tool',`调用 ${action.tool}`,'执行受限工具',{tool:action.tool,status:'running'}); patch(task);
    let result;
    try { result=await fn(action.args); }
    catch(e) { const msg=text(e?.message||e).slice(0,500); rt.failures[action.tool]=(rt.failures[action.tool]||0)+1; event(task,'error',`${action.tool} 失败`,msg,{tool:action.tool,status:'failed'}); rt.observations.push({type:'error',title:action.tool,detail:msg}); patch(task);
      if(action.tool==='sync_mailbox'||action.tool==='search_mail'){task.question=`${action.tool==='sync_mailbox'?'同步':'搜索'}失败：${msg}。可以重试，或使用已缓存范围吗？`;setStatus(task,'needs_input');} else if(action.tool==='read_mail'){rt.observations.push({type:'observation',title:'跳过正文',detail:'该邮件正文读取失败，继续处理其他邮件'}); if(rt.failures[action.tool]>=3){task.warning='多封正文读取失败，已跳过并保留可用结果。';} } else if(rt.failures[action.tool]>=2){task.warning=`${action.tool} 连续失败，任务停止等待人工处理。`;setStatus(task,'failed');} return; }
    metadataFromResult(rt,result);
    const detail=summarizeResult(result); event(task,'observation',`${action.tool} 返回`,detail,{tool:action.tool,status:'success'}); rt.observations.push({type:'observation',title:action.tool,detail,private:action.tool==='read_mail'?text(result?.text||result?.body||'').slice(0,16000):undefined});
    if(action.tool==='sync_mailbox') rt.phase='synced';
    if(action.tool==='search_mail') {rt.phase='searched'; const raw=[...new Set((result?.mailIds||result?.messages?.map(m=>m.id)||[]).map(String))]; const selected=new Set(task.selectedMailIds); rt.searchIds=(selected.size?raw.filter(id=>selected.has(id)):raw).slice(0,100);}
    if(action.tool==='read_mail') {rt.phase='read';rt.readIds.add(action.args.mailId);rt.bodyCount++;}
    if(action.tool==='draft_todo') {const todo=result?.todo||result;if(todo?.id){rt.todoIds.push(String(todo.id));rt.todoMailIds.add(action.args.mailId);task.result.todoIds.push(String(todo.id));}rt.phase='read';}
    if(action.tool==='prepare_flags') localPrepareFlags(task,action.args.mailIds,action.args.flagged);
    resultIds(task); patch(task);
  }

  async function run(id) {
    const task=tasks.get(id), rt=task&&runtimeFor(task); if(!task||!rt||rt.running) return;
    rt.running=true; rt.cancelled=false; if(task.status==='awaiting_start'||task.status==='interrupted') setStatus(task,'running');
    try {
      while (canRun(task) && task.status==='running') {
        const action=await choose(task); if(!canRun(task)||task.status!=='running') break;
        await execute(task,action);
        if(task.status!=='running') break;
        // A cancellation can arrive between an awaited tool and the next planner call.
        if(rt.cancelled){setStatus(task,'cancelled');break;}
      }
    } catch(e) { task.warning=text(e?.message||e).slice(0,500); event(task,'error','Agent 运行异常',task.warning);setStatus(task,'failed'); }
    finally {rt.running=false;patch(task);}
  }
  function start(id) { const task=tasks.get(id); if(!task) throw new Error('任务不存在'); if(task.status==='cancelled'||task.status==='completed'||task.status==='failed') return publicTask(task); if(task.status==='needs_input'||task.status==='awaiting_approval') return publicTask(task); if(!runtimeFor(task)) throw new Error('任务运行上下文不存在'); void run(id); return publicTask(task); }
  function cancel(id) { const task=tasks.get(id); if(!task) throw new Error('任务不存在'); const rt=runtimeFor(task); if(rt) rt.cancelled=true; if(task.status==='awaiting_approval'||task.status==='needs_input'||task.status==='running'||task.status==='awaiting_start'){task.warning='已取消；不会再执行下一步写操作。';task.status='cancelled';event(task,'finish','任务已取消',task.warning);patch(task);} return publicTask(task); }
  function respond(id,{answer}={}) { const task=tasks.get(id); if(!task) throw new Error('任务不存在'); if(typeof answer!=='string'||!answer.trim()||answer.length>1000) throw new Error('回答需为 1–1000 字'); const rt=runtimeFor(task); task.goal=`${task.goal}\n用户补充：${answer.trim()}`.slice(0,2000); task.question=undefined; if(rt){rt.cap=capabilities(task.goal);rt.phase=rt.phase==='init'?'init':rt.phase;rt.cancelled=false;} task.status='awaiting_start';event(task,'observation','收到用户补充',answer.trim());patch(task);return publicTask(task); }
  function approve(id,{actionId,approved}={}) { const task=tasks.get(id); if(!task) throw new Error('任务不存在'); const rt=runtimeFor(task); if(rt?.identity!==contextIdentity()) throw new Error('当前邮箱账号已改变，旧确认已失效'); if(task.status!=='awaiting_approval') throw new Error('当前没有待确认的红旗操作'); const pending=task.pendingActions.find(a=>a.id===actionId); if(!pending||pending.status!=='pending') throw new Error('确认项不存在或已处理'); pending.status=approved===true?'approved':'rejected'; event(task,'approval',approved===true?'已确认红旗':'已拒绝红旗',pending.subject,{status:pending.status});
    if(approved===true){const fn=toolset.flag_mail||toolset.flagMessage; if(typeof fn!=='function'){pending.status='failed';task.warning='红旗工具未接入；没有声称写入成功。';setStatus(task,'failed');return publicTask(task);} task.status='awaiting_approval'; const args={taskId:task.id,mailId:pending.mailId,flagged:pending.flagged,actionId:pending.id}; task.budgets.steps++; void Promise.resolve(fn(args)).then(result=>{pending.status='approved';event(task,'observation','红旗写入已返回',summarizeResult(result),{tool:'flag_mail',status:'success'});if(task.pendingActions.every(a=>a.status!=='pending')){task.result.summary='已完成你确认的红旗操作';setStatus(task,'completed');}else patch(task);}).catch(e=>{pending.status='failed';event(task,'error','红旗写入失败',text(e?.message||e),{tool:'flag_mail',status:'failed'});task.warning='红旗未能确认写入，请同步检查；没有自动重复写入。';setStatus(task,'failed');}); }
    else if(task.pendingActions.every(a=>a.status!=='pending')){task.result.summary='已处理红旗确认项，没有执行被拒绝的写入。';setStatus(task,'completed');} else patch(task); return publicTask(task); }
  function hydrate(saved=[]) { for(const old of Array.isArray(saved)?saved.slice(-MAX_TASKS):[]) { if(!old?.id||tasks.has(old.id)) continue; const task=structuredClone(old); if(task.status==='running'||task.status==='awaiting_approval'){task.status='interrupted';task.warning='进程重启后已中断；需要重新开始，旧写操作确认已失效。';for(const p of task.pendingActions||[])if(p.status==='pending')p.status='rejected';} task._runtime={identity:contextIdentity(),cap:capabilities(task.goal),phase:'init',searchIds:[],searchMeta:new Map(),readIds:new Set(),todoIds:task.result?.todoIds||[],todoMailIds:new Set(),flagIds:[],lastAction:null,repeated:0,cancelled:false,running:false,bodyCount:0,observations:[],failures:{}};tasks.set(task.id,task);runtimes.set(task.id,task._runtime);delete task._runtime; } emit({}); }
  function reset() { epoch++; for(const rt of runtimes.values()){rt.cancelled=true;rt.identity='invalidated';} runtimes.clear(); tasks.clear(); }
  return {create,list,get,start,cancel,respond,approve,hydrate,reset};
}
