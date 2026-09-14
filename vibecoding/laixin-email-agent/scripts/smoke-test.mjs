import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const port=8798;
const origin=`http://127.0.0.1:${port}`;
const directory=await mkdtemp(path.join(os.tmpdir(),'mail-focus-smoke-'));
let child;
let log='';
async function start(){
  child=spawn(process.execPath,['server/index.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DATA_DIR:directory},stdio:['ignore','pipe','pipe']});
  child.stdout.on('data', chunk=>{log+=chunk.toString()});
  child.stderr.on('data', chunk=>{log+=chunk.toString()});
  for(let i=0;i<100;i++){
    if(child.exitCode!==null) throw new Error(`Server exited: ${log}`);
    try{const r=await fetch(`${origin}/api/health`);if(r.ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error('Server startup timeout');
}
async function stop(){if(child&&child.exitCode===null){const exit=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');await exit;}}
async function api(endpoint,method='GET',body,expected=200,customOrigin=origin){
  const response=await fetch(origin+endpoint,{method,headers:{Origin:customOrigin,...(body!==undefined?{'Content-Type':'application/json'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const data=await response.json();
  assert.equal(response.status,expected,`${method} ${endpoint}: ${JSON.stringify(data).slice(0,300)}`);
  return data;
}
try{
  await start();
  let state=await api('/api/state');
  assert.equal(state.mode,'demo'); assert(state.messages.length>0);
  assert(!JSON.stringify(state).includes('authCode'));
  await api('/api/settings','PUT',state.settings,403,'https://untrusted.example');
  const mail=state.messages.find(m=>/面试/.test(m.subject))??state.messages[0];
  const unknown=await api('/api/query','POST',{query:'来自 nonexistent-unique-xyz@example.invalid 的邮件'});
  assert.equal(unknown.mailIds.length,0,'Unknown sender must not return entire inbox');
  state=await api('/api/run','POST',{});
  const draft=state.briefs.find(b=>b.status==='draft'); assert(draft,'manual run creates draft');
  state=await api(`/api/briefs/${encodeURIComponent(draft.id)}/accept`,'POST',{});
  assert.equal(state.briefs.find(b=>b.id===draft.id).status,'accepted');
  state=await api('/api/run','POST',{});
  const after=state.briefs.filter(b=>b.status==='draft');
  assert(after.every(b=>b.mailIds.every(id=>!draft.mailIds.includes(id))),'accepted IDs must not duplicate');
  const flagEndpoint=`/api/messages/${encodeURIComponent(mail.id)}/flag`;
  const refused=await fetch(origin+flagEndpoint,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({flagged:!mail.flagged})});
  assert(refused.status>=400,'flag requires explicit confirmation');
  state=await api(flagEndpoint,'POST',{flagged:!mail.flagged,confirmed:true});
  assert.equal(state.messages.find(m=>m.id===mail.id).flagged,!mail.flagged);
  assert.equal(state.messages.find(m=>m.id===mail.id).unread,mail.unread,'Flag cannot alter read state');
  const body=await api(`/api/messages/${encodeURIComponent(mail.id)}/body`); assert(body.text);
  state=await api('/api/todos/extract','POST',{mailId:mail.id,useModel:false});
  const todo=state.todos.find(t=>t.mailId===mail.id); assert(todo); assert.equal(todo.status,'draft'); assert(todo.evidence);
  state=await api(`/api/todos/${encodeURIComponent(todo.id)}`,'PUT',{company:todo.company,role:todo.role,time:todo.time,link:todo.link,notes:'用户核对过的测试备注',status:'confirmed'});
  assert.equal(state.todos.find(t=>t.id===todo.id).status,'confirmed');
  const sent=await api('/api/sent'); assert(sent.messages.length);
  state=await api('/api/tracking','POST',{mailId:sent.messages[0].id}); assert(state.tracking.length);
  await stop(); await start();
  state=await api('/api/state'); assert(state.todos.some(t=>t.id===todo.id&&t.status==='confirmed'),'local todo persists restart');
  assert.equal(state.connected,false,'restart must not fabricate a live session');
  console.log('HTTP smoke: PASS — cross-origin rejection, fail-closed query, digest dedupe, confirmed flag/read-state, selected-mail todo review, tracking, durable restart');
}finally{await stop();await rm(directory,{recursive:true,force:true});}
