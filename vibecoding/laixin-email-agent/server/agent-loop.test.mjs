import test from 'node:test';
import assert from 'node:assert/strict';
import {createAgentEngine} from './agent-loop.mjs';

function harness({searchIds=['m1'],tools={},context={mode:'demo',account:'demo'}}={}) {
  const calls=[];
  const all={sync_mailbox:async a=>{calls.push(['sync_mailbox',a]);return {scope:'demo'}},search_mail:async a=>{calls.push(['search_mail',a]);return {mailIds:searchIds,messages:searchIds.map(id=>({id,subject:'面试',address:'hr@example.com'}))}},read_mail:async a=>{calls.push(['read_mail',a]);return {text:'公司：Acme\n岗位：实习生\n面试时间：明天\n链接：https://example.com/x'}},draft_todo:async a=>{calls.push(['draft_todo',a]);return {id:`todo_${a.mailId}`}},...tools};
  return {calls,engine:createAgentEngine({getContext:()=>context,tools:all})};
}

test('rules planner adapts through sync, search, read and todo',async()=>{const h=harness();const t=h.engine.create({goal:'查今天面试邮件并整理待办'});h.engine.start(t.id);await new Promise(r=>setTimeout(r,40));const out=h.engine.get(t.id);assert.equal(out.status,'completed');assert.deepEqual(out.result.mailIds,['m1']);assert.deepEqual(out.result.todoIds,['todo_m1']);assert.deepEqual(h.calls.map(x=>x[0]),['sync_mailbox','search_mail','read_mail','draft_todo']);});

test('flag is prepared but never written before approval',async()=>{let writes=0;const h=harness({tools:{flag_mail:async()=>{writes++;return {flagged:true}}}});const t=h.engine.create({goal:'查找面试邮件并标记为红旗'});h.engine.start(t.id);await new Promise(r=>setTimeout(r,40));let out=h.engine.get(t.id);assert.equal(out.status,'awaiting_approval');assert.equal(writes,0);assert.equal(out.pendingActions.length,1);h.engine.approve(t.id,{actionId:out.pendingActions[0].id,approved:true});await new Promise(r=>setTimeout(r,20));assert.equal(writes,1);});

test('unknown model action is rejected and falls back to rules',async()=>{const h=harness();const t=h.engine.create({goal:'查今天面试邮件',useModel:true});const engine=createAgentEngine({getContext:()=>({mode:'demo',account:'demo'}),tools:{sync_mailbox:async()=>({scope:'x'}),search_mail:async()=>({mailIds:[]})},planWithModel:async()=>({tool:'delete_mail',args:{}})});const x=engine.create({goal:'查今天面试邮件',useModel:true});engine.start(x.id);await new Promise(r=>setTimeout(r,40));assert.ok(['needs_input','failed'].includes(engine.get(x.id).status));});

test('cancel stops pending continuation',async()=>{let resolve;let calls=0;const h=harness({tools:{sync_mailbox:()=>{calls++;return new Promise(r=>{resolve=r})}}});const t=h.engine.create({goal:'查今天面试邮件'});h.engine.start(t.id);await new Promise(r=>setTimeout(r,5));h.engine.cancel(t.id);resolve({scope:'x'});await new Promise(r=>setTimeout(r,20));assert.equal(h.engine.get(t.id).status,'cancelled');assert.equal(calls,1);});
