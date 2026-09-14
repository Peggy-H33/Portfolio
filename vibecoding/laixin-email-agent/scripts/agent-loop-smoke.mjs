#!/usr/bin/env node
/**
 * Contract-level smoke tests for the goal-driven Agent loop.
 *
 * Run with `node scripts/agent-loop-smoke.mjs`.  The script starts an isolated
 * demo-mode server with a temporary DATA_DIR, so it never touches a user's
 * mailbox or the normal .data directory.  It intentionally exercises the
 * public task API rather than importing implementation details.
 */
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const port = 8797;
const base = `http://127.0.0.1:${port}`;
const dataDir = await mkdtemp(path.join(tmpdir(), 'mail-focus-agent-loop-'));
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = spawn(process.execPath, ['server/index.mjs'], {
  cwd: projectRoot,
  env: {...process.env, PORT: String(port), DATA_DIR: dataDir},
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
server.stderr.on('data', chunk => { serverOutput += chunk.toString(); });

async function stop() {
  if (server.exitCode === null && !server.killed) {
    await new Promise(resolve => {
      server.once('exit', resolve);
      server.kill('SIGTERM');
    });
  }
  await rm(dataDir, {recursive: true, force: true});
}

async function request(method, url, body) {
  const response = await fetch(`${base}${url}`, {
    method,
    headers: body === undefined ? undefined : {'content-type': 'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  return {response, payload};
}

async function waitHealthy() {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    try {
      const {response} = await request('GET', '/api/health');
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`server did not become healthy\n${serverOutput}`);
}

async function task(taskId) {
  const {response, payload} = await request('GET', '/api/agent/tasks');
  assert.equal(response.status, 200);
  const found = payload.tasks?.find(item => item.id === taskId);
  assert.ok(found, `task ${taskId} is missing from task list`);
  return found;
}

async function waitFor(taskId, statuses, timeout = 8_000) {
  const wanted = new Set(statuses);
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const current = await task(taskId);
    if (wanted.has(current.status)) return current;
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  throw new Error(`task ${taskId} did not reach ${[...wanted].join(', ')}`);
}

async function create(goal, extra = {}) {
  const {response, payload} = await request('POST', '/api/agent/tasks', {
    goal,
    useModel: false,
    ...extra,
  });
  assert.equal(response.status, 200);
  assert.ok(payload.task?.id);
  return payload.task;
}

try {
  await waitHealthy();

  // Planning is a preview: creating a task must not sync, flag, or write a todo.
  const before = (await request('GET', '/api/state')).payload;
  const planned = await create('整理最新的面试邮件，提取公司、岗位、时间和链接并生成待办', {selectedMailIds: ['demo_mail_1']});
  assert.equal(planned.status, 'awaiting_start');
  assert.equal(planned.budgets?.steps, 0);
  assert.ok(Array.isArray(planned.plan) && planned.plan.length > 0);
  assert.ok(planned.events?.some(event => event.type === 'plan'));
  const afterPlan = (await request('GET', '/api/state')).payload;
  assert.equal(afterPlan.todos.length, before.todos.length, 'plan preview created a todo');
  assert.equal(afterPlan.messages.find(mail => mail.id === 'demo_mail_1')?.flagged, false, 'plan preview changed a flag');

  // A goal that lacks a reliable target must pause for clarification instead of broadening search.
  const ambiguous = await create('帮我处理一下邮件');
  const ambiguousStarted = await request('POST', `/api/agent/tasks/${ambiguous.id}/start`, {});
  assert.equal(ambiguousStarted.response.status, 200);
  const needsInput = await waitFor(ambiguous.id, ['needs_input']);
  assert.ok(needsInput.question, 'needs_input task must expose a user question');
  assert.equal(needsInput.result?.mailIds?.length ?? 0, 0, 'ambiguous goal widened to arbitrary mail');
  const clarified = await request('POST', `/api/agent/tasks/${ambiguous.id}/respond`, {answer: '只看主题包含“面试”的新邮件'});
  assert.equal(clarified.response.status, 200);
  assert.equal(clarified.payload.task.status, 'awaiting_start');

  // Start the interview task and verify it makes progress through tools and returns a todo.
  const firstStart = await request('POST', `/api/agent/tasks/${planned.id}/start`, {});
  assert.equal(firstStart.response.status, 200);
  const completed = await waitFor(planned.id, ['completed', 'failed']);
  assert.equal(completed.status, 'completed');
  assert.ok(completed.result.todoIds?.length >= 1, 'interview goal did not produce a todo');
  assert.ok(completed.events.some(event => event.type === 'tool' && event.tool === 'draft_todo'));
  assert.ok(completed.events.every(event => !/你好，感谢你的申请|https:\/\/example\.com\/interview\/1842/.test(event.detail)), 'task events leaked raw body content');

  // Repeated starts are idempotent and do not run a second draft operation.
  const eventCount = completed.events.length;
  const repeatA = await request('POST', `/api/agent/tasks/${planned.id}/start`, {});
  const repeatB = await request('POST', `/api/agent/tasks/${planned.id}/start`, {});
  assert.equal(repeatA.response.status, 200);
  assert.equal(repeatB.response.status, 200);
  const repeated = await waitFor(planned.id, ['completed']);
  assert.equal(repeated.events.length, eventCount, 'repeated start appended duplicate execution events');

  // Cancellation before start is a hard stop and must not execute any tool.
  const abandoned = await create('整理最近的面试邮件并生成待办', {selectedMailIds: ['demo_mail_1']});
  const todoCountBeforeCancel = (await request('GET', '/api/state')).payload.todos.length;
  const cancelled = await request('POST', `/api/agent/tasks/${abandoned.id}/cancel`, {});
  assert.equal(cancelled.response.status, 200);
  assert.equal(cancelled.payload.task.status, 'cancelled');
  assert.equal(cancelled.payload.task.budgets.steps, 0, 'cancelled task executed after the stop request');
  assert.equal((await request('GET', '/api/state')).payload.todos.length, todoCountBeforeCancel, 'cancel test executed a todo write');

  // Red-flag is a proposal first.  No flag write is allowed before approval.
  const flagTask = await create('把这封邮件标记为红旗', {selectedMailIds: ['demo_mail_2']});
  await request('POST', `/api/agent/tasks/${flagTask.id}/start`, {});
  const approval = await waitFor(flagTask.id, ['awaiting_approval']);
  assert.equal(approval.pendingActions?.length, 1);
  assert.equal(approval.pendingActions[0].type, 'flag');
  assert.equal((await request('GET', '/api/state')).payload.messages.find(mail => mail.id === 'demo_mail_2')?.flagged, false, 'flag was written before approval');
  const approved = await request('POST', `/api/agent/tasks/${flagTask.id}/approve`, {actionId: approval.pendingActions[0].id, approved: true});
  assert.equal(approved.response.status, 200);
  const flagDone = await waitFor(flagTask.id, ['completed', 'failed']);
  assert.equal(flagDone.status, 'completed');
  assert.equal((await request('GET', '/api/state')).payload.messages.find(mail => mail.id === 'demo_mail_2')?.flagged, true, 'approved flag was not applied');

  // Unknown IDs are rejected/contained; they must never cause the loop to read arbitrary data.
  const unknown = await request('POST', '/api/agent/tasks', {goal: '读取并整理这封邮件', useModel: false, selectedMailIds: ['does-not-exist']});
  assert.ok([400, 404, 200].includes(unknown.response.status));
  if (unknown.response.ok) {
    const unknownTask = unknown.payload.task;
    assert.ok(unknownTask);
    await request('POST', `/api/agent/tasks/${unknownTask.id}/start`, {});
    const unknownDone = await waitFor(unknownTask.id, ['needs_input', 'failed', 'completed']);
    assert.equal(unknownDone.result?.mailIds?.includes('does-not-exist') ?? false, false);
    assert.equal(JSON.stringify(unknownDone).includes('demo_mail_1'), false, 'unknown-ID task exposed unrelated mail data');
  }

  console.log('agent-loop-smoke: ok');
} catch (error) {
  console.error(`agent-loop-smoke: failed: ${error.message}`);
  if (serverOutput) console.error(serverOutput);
  process.exitCode = 1;
} finally {
  await stop();
}
