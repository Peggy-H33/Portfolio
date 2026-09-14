import crypto from 'node:crypto';

export const scope = '收件箱最近 30 天，最多 300 封；不含垃圾箱、其他文件夹和附件';
export const defaults = { senders: ['recruitment@example.com', 'professor@example.edu'], keywords: ['面试', '实习', '发票'], slots: [{ id: 'morning', time: '08:00', enabled: true }, { id: 'afternoon', time: '13:00', enabled: true }, { id: 'evening', time: '20:30', enabled: true }], timezone: 'Asia/Shanghai', notifications: false };
export const id = prefix => `${prefix}_${crypto.randomUUID()}`;
export const stamp = () => new Date().toISOString();
export const stableId = (account, mailbox, validity, uid) => crypto.createHash('sha256').update(JSON.stringify([account.toLowerCase(), mailbox, String(validity), uid])).digest('hex').slice(0, 32);
export function validateSettings(value) {
  if (!value || !Array.isArray(value.senders) || !Array.isArray(value.keywords) || !Array.isArray(value.slots)) throw new Error('规则格式无效');
  if (value.senders.length > 100 || value.keywords.length > 100 || value.slots.length !== 3) throw new Error('最多 100 个关注主体/关键词，必须有三个汇报时段');
  const senders = [...new Set(value.senders.map(s => String(s).trim().toLowerCase()).filter(Boolean))];
  if (senders.some(s => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))) throw new Error('关注主体请填写完整邮箱地址');
  const keywords = [...new Set(value.keywords.map(s => String(s).trim()).filter(Boolean))];
  if (keywords.some(s => s.length > 100)) throw new Error('关键词过长');
  const slots = value.slots.map(s => ({id: String(s.id), time: String(s.time), enabled: s.enabled === true}));
  if (new Set(slots.map(s=>s.id)).size !== 3 || slots.some(s => !['morning','afternoon','evening'].includes(s.id) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))) throw new Error('定时任务格式无效');
  return {senders, keywords, slots, timezone:'Asia/Shanghai', notifications:value.notifications === true};
}
export function classify(messages, settings, tracking = []) {
  return messages.map(mail => {
    const reasons = [];
    if (settings.senders.includes(mail.address.toLowerCase())) reasons.push('关注发件人');
    for (const word of settings.keywords) if (mail.subject.toLowerCase().includes(word.toLowerCase())) reasons.push(`主题包含「${word}」`);
    const refs = new Set([mail.inReplyTo, ...(mail.references || [])].filter(Boolean));
    const tracked = tracking.find(t => refs.has(t.messageId));
    if (tracked) reasons.push('已追踪邮件的回复');
    return {...mail, matchReasons:reasons, replyToTrackedId:tracked?.id};
  });
}
export function reconcileTracking(messages, tracking) {
  return tracking.map(t => { const replyIds=messages.filter(m=>m.replyToTrackedId===t.id).map(m=>m.id); const all = [...new Set([...(t.replyIds || []), ...replyIds])]; return {...t,replyIds:all,status:all.length?'replied':'waiting'}; });
}
export const dateShanghai = d => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
export function scheduleDue(settings, completed, now = new Date()) {
  const day=dateShanghai(now); const mins=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
  return settings.slots.filter(s=>s.enabled && s.time <= mins && !completed.includes(`${day}:${s.id}`)).map(s=>({...s,key:`${day}:${s.id}`}));
}
export function nextRun(settings, now = new Date()) {
  const day=dateShanghai(now), future = settings.slots.filter(s=>s.enabled).map(s=>new Date(`${day}T${s.time}:00+08:00`));
  for (const d of future) if (d <= now) d.setTime(d.getTime()+86400000);
  return future.length?new Date(Math.min(...future.map(d=>d.getTime()))).toISOString():null;
}
export function queryMail(query, messages, now = new Date()) {
  if (typeof query!=='string' || !query.trim() || query.length>500) throw new Error('请输入 1–500 字的查询');
  let text=query.trim(), date=null, filters=[], tokens=[];
  if (/昨天/.test(text)) {date=dateShanghai(new Date(now.getTime()-86400000));filters.push('昨天收到');}
  else if (/今天|今日|新邮件|新发|新回复/.test(text)) {date=dateShanghai(now); filters.push('今天收到（“新邮件”按今天解释）');}
  const unread=/未读/.test(text); if (unread) filters.push('未读');
  const email=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (email) tokens.push({type:'sender',value:email.toLowerCase()});
  const quoted=text.match(/[「“"']([^」”"']+)[」”"']/)?.[1];
  let topic=text.match(/(?:关于|主题(?:包含|含有|是|为)?|标题(?:包含|含有|是|为)?)\s*[「“"']?([^」”"'？?，,。]+?)(?:的邮件|邮件|[」”"']|$)/)?.[1]?.trim();
  if (topic) tokens.push({type:'topic',value:topic});
  else if (quoted && !email) tokens.push({type:/发件|主体|来自|发来/.test(text)?'sender':'topic',value:quoted});
  if (!tokens.length) {
    const from=text.match(/(?:来自|发件人(?:是|为)?|主体(?:是|为)?)\s*(.+?)(?:发来|的邮件|邮件|有没有|是否|？|\?|$)/)?.[1] || text.match(/^(.+?)(?:是否有|有没有|有无|发来|发的)/)?.[1];
    if (from) {const v=from.replace(/^(?:帮我查(?:一下)?|请问|查询|查看)\s*/,'').replace(/今天|昨天|最近|新/g,'').trim(); if(v) tokens.push({type:'sender',value:v});}
  }
  const broad=/^(?:(?:查看|查询|给我看看|帮我查|我|有|的|哪些|是否|没有|有没有|邮件|新邮件|今天|昨天|今日|未读|收到|最近|全部|所有|？|\?|\s))*$/.test(text);
  if (!tokens.length && !broad) throw new Error('未能可靠理解查询。请用“来自 hr@example.com 的邮件”或“主题包含 面试 的邮件”；我没有扩大搜索范围。');
  const result=messages.filter(m=>(!date||dateShanghai(new Date(m.receivedAt))===date)&&(!unread||m.unread)&&tokens.every(t=>t.type==='sender'?`${m.sender} ${m.address}`.toLowerCase().includes(t.value.toLowerCase()):`${m.subject} ${m.preview}`.toLowerCase().includes(t.value.toLowerCase())));
  filters.push(...tokens.map(t=>`${t.type==='sender'?'发件人':'主题/已缓存摘要'}包含「${t.value}」`));
  return {interpretation:filters.join('；')||'查看当前已同步邮件',warning:'仅查询已同步范围；不代表全邮箱没有其他结果。未检索附件或未读取的正文。',mailIds:result.map(m=>m.id),scope};
}
export function safeUrl(value) { if(!value) return ''; try {const u=new URL(value); if(['https:','http:'].includes(u.protocol) && !u.username && !u.password) return value;}catch{} throw new Error('链接仅允许不含账号密码的 http/https 地址'); }
export function extractRules(mail, text) {
  const capture = re => text.match(re)?.[1]?.trim() || '';
  const company=capture(/(?:公司|企业|Company)\s*[:：]\s*([^\r\n]{1,100})/i);
  const role=capture(/(?:岗位|职位|Role|Position)\s*[:：]\s*([^\r\n]{1,100})/i);
  const time=capture(/(?:面试时间|会议时间|时间|Date\/Time)\s*[:：]\s*([^\r\n]{1,150})/i);
  const link=text.match(/https?:\/\/[^\s<>"）)]+/)?.[0] || '';
  const evidence=[company,role,time,link].filter(Boolean).map(v=>text.split(/\r?\n/).find(line=>line.includes(v))||v).filter((v,i,a)=>a.indexOf(v)===i).join('\n');
  return {id:id('todo'),mailId:mail.id,company,role,time,link,notes:(!company||!role||!time)?'部分信息未能从原文确定，请补充核对。':'请核对原文后确认加入待办。',evidence:evidence||'未提取到确定字段，请手动补充。',status:'draft',source:'rules'};
}
export function validateModelDraft(value, mail, text) {
  if (!value || typeof value !=='object' || Array.isArray(value)) throw new Error('模型返回格式不正确');
  const out={}; for(const key of ['company','role','time','link']) {let v=typeof value[key]==='string'?value[key].trim():''; if(v.length>1000 || (v&&!text.includes(v))) v=''; out[key]=v;}
  out.link=safeUrl(out.link);
  const evidence=Object.values(out).filter(Boolean).map(v=>text.split(/\r?\n/).find(line=>line.includes(v))||v).filter((v,i,a)=>a.indexOf(v)===i).join('\n');
  return {id:id('todo'),mailId:mail.id,...out,notes:'模型提取结果；字段已核对是否出现在原文中，仍需你确认。',evidence:evidence||'没有通过原文校验的字段，请手动补充。',status:'draft',source:'deepseek'};
}
export function freshState(messages=[]) {return {settings:structuredClone(defaults),messages,todos:[],briefs:[],runs:[],tracking:[],agentTasks:[],reportedIds:[],scheduledKeys:[],sync:{lastAt:null,error:null,scope,partial:false}};}
export function demoData(now=new Date()) {
  const at=(hour,days=0)=>new Date(`${dateShanghai(new Date(now.getTime()-days*86400000))}T${hour}:00+08:00`).toISOString();
  const make=(n,sender,address,subject,body,hour='09:20',extra={})=>({id:`demo_mail_${n}`,sender,address,subject,preview:body.replace(/\n/g,' ').slice(0,150),receivedAt:at(hour),flagged:false,unread:true,matchReasons:[],messageId:`<demo-${n}@mail-focus.example>`,_body:body,...extra});
  return [
    make(1,'星河科技招聘','recruitment@example.com','【面试邀请】产品实习生 · 星河科技','你好，感谢你的申请。\n公司：星河科技\n岗位：产品实习生\n面试时间：2026年9月15日 14:00–14:45（北京时间）\n会议链接：https://example.com/interview/1842\n请提前 10 分钟进入会议，并准备个人作品集。','09:20',{inReplyTo:'<application-01@mail-focus.example>',references:['<application-01@mail-focus.example>']}),
    make(2,'陈老师','professor@example.edu','Re: 关于研究助理申请的沟通','你好，已收到你的简历。请在下周一之前发送一份研究计划，我们再安排一次线上交流。','10:10'),
    make(3,'白桦设计招聘','talent@example.org','产品设计实习生面试安排','公司：白桦设计\n岗位：产品设计实习生\n面试时间：2026年9月16日 10:30（北京时间）\n面试链接：https://example.org/meeting/design\n请回复确认是否可以参加。','11:40'),
    make(4,'电子发票服务','invoice@example.net','【电子发票】你的差旅发票已开具','你的差旅电子发票已开具，请在财务报销截止前下载。此演示没有附件。','12:00'),
    make(5,'商城活动','offers@example.net','秋日会员专享优惠','本周好物优惠已上线，领取购物券。','08:10'),
    make(6,'招聘平台','noreply@example.net','本周职位推荐','为你整理了本周热门工作机会。','07:30'),
    make(7,'云帆科技 HR','hr@example.org','关于前端实习生的一轮沟通','感谢你的投递，我们计划近期安排面试，具体时间另行通知。','10:50'),
  ];
}
export function demoSent(now=new Date()) {return [{id:'demo_sent_1',sender:'我',address:'you@163.com',to:'recruitment@example.com',subject:'产品实习生申请 — 简历',preview:'您好，申请产品实习生岗位，附件为简历。',receivedAt:new Date(now.getTime()-86400000).toISOString(),flagged:false,unread:false,matchReasons:[],messageId:'<application-01@mail-focus.example>'}];}
