import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CircleHelp, Mail as MailIcon, Sparkles, X } from 'lucide-react';
import { api } from './api';
import type { AgentTask, AgentTasksProps } from './agent-task-types';
import './agent-tasks.css';

const statusLabel: Record<AgentTask['status'], string> = { awaiting_start: '待启动', running: '运行中', needs_input: '需要你的回答', awaiting_approval: '等待确认', completed: '已完成', cancelled: '已取消', failed: '失败', interrupted: '已中断' };
const statusTone = (status: AgentTask['status']) => status === 'completed' ? 'success' : status === 'running' ? 'running' : status === 'failed' || status === 'interrupted' ? 'danger' : status === 'needs_input' || status === 'awaiting_approval' ? 'attention' : '';
const fmt = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); };

export function AgentTasks({ mails, modelConfigured, mode, onStateChanged }: AgentTasksProps) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [goal, setGoal] = useState('');
  const [useModel, setUseModel] = useState(false);
  const [selectedMailIds, setSelectedMailIds] = useState<string[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [showMailPicker, setShowMailPicker] = useState(false);

  const load = useCallback(async () => {
    try { const data = await api<{ tasks: AgentTask[] }>('/agent/tasks'); setTasks(data.tasks); setSelectedTaskId((current) => current || data.tasks[0]?.id || ''); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : '无法读取 Agent 任务。'); }
  }, []);
  // Loading task state is an intentional synchronization with the local Agent service.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const running = tasks.some((task) => task.status === 'running');
  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 1500);
    return () => window.clearInterval(timer);
  }, [running, load]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  const request = async <T,>(path: string, body?: unknown) => { setBusy(path); setError(''); try { const data = await api<T>(path, { method: 'POST', body: body ?? {} }); await load(); onStateChanged(); return data; } catch (err) { setError(err instanceof Error ? err.message : '操作没有完成。'); return null; } finally { setBusy(''); } };
  const createTask = async () => { if (!goal.trim() || goal.trim().length > 2000 || busy) return; const data = await request<{ task: AgentTask }>('/agent/tasks', { goal: goal.trim(), useModel, selectedMailIds }); if (data?.task) { setTasks((current) => [data.task, ...current.filter((task) => task.id !== data.task.id)]); setSelectedTaskId(data.task.id); setGoal(''); setSelectedMailIds([]); setShowMailPicker(false); await request<{ task: AgentTask }>(`/agent/tasks/${encodeURIComponent(data.task.id)}/start`); } };

  return <div className="agent-tasks" data-mode={mode}>
    <section className="agent-composer surface">
      <div className="agent-composer-title"><span className="eyebrow">Agent for a Letter</span><h3>想让Agent帮你做什么</h3></div>
      <textarea id="agent-goal" value={goal} onChange={(event) => setGoal(event.target.value.slice(0, 2000))} placeholder="例如：找出最近 7 天和面试相关的来信，整理成待办；如果需要把它们标红，先问我。" rows={3} />
      <div className="agent-examples"><span>试着说</span>{['整理最近的面试邮件并生成待办', '查找某公司有没有新回复', '把这几封重要来信标成红旗'].map((example) => <button key={example} onClick={() => setGoal(example)}>{example}</button>)}</div>
      <div className="agent-composer-bottom"><div className="agent-options"><label className="checkbox-line"><input type="checkbox" checked={useModel} onChange={(event) => setUseModel(event.target.checked)} disabled={!modelConfigured} /><span>允许 DeepSeek 辅助理解目标</span></label><small>{useModel ? '会发送目标和必要的邮件元数据；读取正文前仍需任务范围授权。' : '规则规划器：目标与权限路径完全在本机判断。'}{!modelConfigured && '（请先在设置中配置 Key）'}</small><button className="text-button" onClick={() => setShowMailPicker((value) => !value)}><MailIcon size={13} />{selectedMailIds.length ? `已选 ${selectedMailIds.length} 封邮件` : '可选：限定到邮件'}</button></div><button className="button primary" onClick={() => void createTask()} disabled={!goal.trim() || !!busy}><Sparkles size={15} />开始任务</button></div>
      {showMailPicker && <div className="agent-mail-picker" role="group" aria-label="限定任务邮件"><div className="picker-head"><strong>限定任务范围</strong><span>最多选择 10 封</span></div>{mails.slice(0, 10).map((mail) => <label key={mail.id}><input type="checkbox" checked={selectedMailIds.includes(mail.id)} onChange={(event) => setSelectedMailIds((current) => event.target.checked ? [...current, mail.id].slice(-10) : current.filter((id) => id !== mail.id))} /><span><b>{mail.subject || '（无主题）'}</b><small>{mail.sender} · {mail.address}</small></span></label>)}</div>}
    </section>
    {error && <div className="alert error" role="alert"><AlertCircle size={17} /><p>{error}</p><button className="icon-button" onClick={() => setError('')} aria-label="关闭错误"><X size={15} /></button></div>}
    <div className="agent-columns">
      <section className="agent-task-list surface"><div className="agent-list-head"><div><h3>任务历史</h3><p className="quiet">最多保留 30 个任务</p></div>{running && <span className="agent-live-dot"><span />正在观察环境</span>}</div>{tasks.length ? tasks.map((task) => <button key={task.id} className={`agent-task-row ${selectedTask?.id === task.id ? 'selected' : ''}`} onClick={() => setSelectedTaskId(task.id)}><span className={`agent-status-dot ${statusTone(task.status)}`} /><span className="agent-task-row-copy"><b>{task.goal}</b><small>{fmt(task.updatedAt)} · {task.mode === 'live' ? '真实邮箱' : '示例数据'} · {task.planner === 'deepseek' ? 'DeepSeek 规划' : '规则规划'}</small></span><span className={`agent-status ${statusTone(task.status)}`}>{statusLabel[task.status]}</span></button>) : <div className="agent-empty"><CircleHelp size={22} /><p>还没有目标任务。先输入一句你真正想完成的事。</p></div>}</section>
    </div>
  </div>;
}
