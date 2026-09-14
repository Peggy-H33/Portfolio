import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Activity, ArrowRight, Bell, Check, CheckCheck,
  CheckCircle2, ChevronRight, CircleHelp, Clock3, ExternalLink, FileText, Flag,
  Inbox, KeyRound, Link2, ListTodo, LoaderCircle, Mail as MailIcon, MailCheck,
  MessageSquareText, Pencil, Plus, Radio, RefreshCw, Search,
  Send, Settings2, ShieldCheck, Sparkles, Sun, Sunrise, Moon, Trash2, Unplug, X,
  AlertCircle, CalendarDays, Building2, BriefcaseBusiness, Eye, EyeOff,
} from 'lucide-react';
import { api, encoded, readableError, safeUrl, type AgentState, type Mail, type QueryResult, type Settings, type Todo } from './api';
import { AgentTasks } from './AgentTasks';

type Page = 'inbox' | 'todos' | 'tracking' | 'briefs' | 'runs' | 'agent' | 'reader';
type SettingsTab = 'connection' | 'rules' | 'schedule' | 'model';
const pageInfo = {
  inbox: { name: '重点收件箱', subtitle: '把注意力留给值得回复的来信。', icon: Inbox },
  todos: { name: '面试与待办', subtitle: '从一封来信，到一件确定要做的事。', icon: ListTodo },
  tracking: { name: '回复追踪', subtitle: '投出的简历与重要联络，都有回音可循。', icon: Send },
  briefs: { name: '每日简报', subtitle: '早、午、晚三个时段，重新掌握你的收件箱。', icon: FileText },
  runs: { name: '运行记录', subtitle: '每一次读取、判断与执行，都留下可查看的记录。', icon: Activity },
  agent: { name: 'Agent', subtitle: '把自然语言目标交给可观察的执行循环。', icon: Sparkles },
  reader: { name: '邮件原文', subtitle: '按需读取一封指定来信的完整正文。', icon: MailIcon },
};
const navPages: Page[] = ['inbox', 'todos', 'tracking', 'briefs', 'agent', 'runs'];
const slotLabels: Record<string, string> = { morning: '晨间简报', afternoon: '午后简报', evening: '晚间简报' };
const slotIcons = [Sunrise, Sun, Moon];
const dateTime = (value: string | null | undefined, short = false) => {
  if (!value) return '尚未运行';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', ...(short ? {} : { year: 'numeric' }), hour12: false, timeZone: 'Asia/Shanghai' });
};
const splitEntries = (value: string) => [...new Set(value.split(/[\n,，;；]/).map((item) => item.trim()).filter(Boolean))];
const initialLetters = (value: string) => (value || '邮').slice(0, 2).toUpperCase();

function Dialog({ title, children, onClose, wide = false, description }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; description?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    const getElements = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]') ?? []);
    getElements()[0]?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key === 'Tab') {
        const elements = getElements();
        const first = elements[0]; const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', listener);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', listener); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} className={`dialog ${wide ? 'dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="dialog-heading"><div><span className="eyebrow">LAIXIN / CONTROL</span><h2>{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={20} /></button></div>
      {children}
    </div>
  </div>;
}

function Empty({ icon = <Inbox size={28} />, title, text, action }: { icon?: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="empty"><div className="empty-symbol">{icon}</div><h3>{title}</h3><p>{text}</p>{action}</div>;
}
function Tag({ children, tone = '' }: { children: ReactNode; tone?: string }) { return <span className={`tag ${tone}`}>{children}</span>; }

function MailReader({
  selected, state, body, busy, useModel, onUseModel, onFlag, onReadBody, onExtractTodo, onOpenSettings, onBack,
}: {
  selected: Mail | null;
  state: AgentState;
  body: { id: string; text: string } | null;
  busy: string;
  useModel: boolean;
  onUseModel: (value: boolean) => void;
  onFlag: (mail: Mail) => void;
  onReadBody: () => void;
  onExtractTodo: () => void;
  onOpenSettings: (tab: SettingsTab) => void;
  onBack?: () => void;
}) {
  return <section className="mail-reader" aria-label="邮件内容">{selected ? <><div className="reader-toolbar"><span><MailIcon size={14} />邮件详情</span><div>{onBack && <button className="text-button reader-back" onClick={onBack}><ArrowRight size={13} />返回收件箱</button>}<button className="icon-button" aria-label={selected.flagged ? '取消红旗' : '设为红旗'} title={selected.flagged ? '取消红旗' : '设为红旗'} disabled={!!busy} onClick={() => onFlag(selected)}><Flag size={17} className={selected.flagged ? 'flagged' : ''} fill={selected.flagged ? 'currentColor' : 'none'} /></button><a className="icon-button" aria-label="打开网易邮箱" href="https://mail.163.com/" target="_blank" rel="noreferrer"><ExternalLink size={16} /></a></div></div><div className="reader-inner"><div className="reader-badges"><Tag tone={state.mode === 'live' ? 'mint' : ''}>{state.mode === 'live' ? '真实邮件' : '示例邮件'}</Tag>{selected.flagged && <Tag tone="red"><Flag size={11} />红旗</Tag>}</div><h2>{selected.subject || '（无主题）'}</h2><div className="sender-line"><div className="sender-avatar">{initialLetters(selected.sender)}</div><div><strong>{selected.sender}</strong><p>{selected.address}</p></div><time>{dateTime(selected.receivedAt, true)}</time></div><div className="why-this"><ShieldCheck size={14} /><p>{selected.matchReasons.length ? `关注原因：${selected.matchReasons.join('；')}` : '未命中关注规则，仍可手动标记或提取待办。'}</p></div><div className="mail-body">{body?.id === selected.id ? <><span className="section-kicker">邮件正文 · 纯文本</span><pre>{body.text || '这封邮件没有可读取的文字正文。'}</pre></> : <><span className="section-kicker">邮件预览</span><p>{selected.preview || '暂无文字预览。'}</p><button className="button secondary compact" onClick={onReadBody} disabled={!!busy}>{busy === 'body' ? <LoaderCircle className="spin" size={15} /> : <Eye size={15} />}读取完整正文</button><small>只读取这封邮件，不改变邮箱中的已读状态。</small></>}</div><div className="extract-card"><div className="extract-icon"><Sparkles size={19} /></div><div><h3>把这封来信整理成待办</h3><p>提取公司、岗位、面试时间和链接，先生成供你核对的草稿。</p></div><label className="checkbox-line"><input type="checkbox" checked={useModel} onChange={(event) => onUseModel(event.target.checked)} disabled={!state.model.configured || !!busy} /><span>允许将此封邮件正文发送给 DeepSeek 辅助整理</span></label>{!state.model.configured && <button className="text-button" onClick={() => onOpenSettings('model')}>可选：配置自己的 DeepSeek Key<ArrowRight size={12} /></button>}<button className="button primary" disabled={!!busy} onClick={onExtractTodo}>{busy === '/todos/extract' ? <LoaderCircle className="spin" size={15} /> : <ListTodo size={15} />}生成待办草稿</button><small>{useModel ? '仅发送你选中的这封邮件；结果需要你确认。' : '当前使用本地规则整理，邮件正文不发送给模型。'}</small></div></div></> : <Empty icon={<MailIcon size={32} />} title="每一封重要来信，都有下一步" text="选择左侧邮件，查看原文、设为红旗，或整理成面试待办。" />}</section>;
}

export function App() {
  const [state, setState] = useState<AgentState | null>(null);
  const [page, setPage] = useState<Page>('inbox');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState<'matched' | 'all' | 'flagged'>('matched');
  const [selectedId, setSelectedId] = useState('');
  const [body, setBody] = useState<{ id: string; text: string } | null>(null);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  const [draftSettings, setDraftSettings] = useState<Settings | null>(null);
  const [senderText, setSenderText] = useState('');
  const [keywordText, setKeywordText] = useState('');
  const [email, setEmail] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [showAuthCode, setShowAuthCode] = useState(false);
  const [modelKey, setModelKey] = useState('');
  const [modelName, setModelName] = useState('deepseek-v4-flash');
  const [useModel, setUseModel] = useState(false);
  const [flagTarget, setFlagTarget] = useState<Mail | null>(null);
  const [todoEdit, setTodoEdit] = useState<Todo | null>(null);
  const [sentOpen, setSentOpen] = useState(false);
  const [sent, setSent] = useState<Mail[]>([]);
  const [sentScope, setSentScope] = useState('最近一批已发送邮件；仅追踪你选中的邮件。');
  const [sentError, setSentError] = useState('');
  const [briefFilter, setBriefFilter] = useState<'active' | 'all'>('active');
  const [todoFilter, setTodoFilter] = useState<'active' | 'done'>('active');
  const priorAccount = useRef<string | null>(null);
  const priorMode = useRef<AgentState['mode'] | null>(null);
  const initializedNotifications = useRef(false);
  const seenBriefIds = useRef(new Set<string>());
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = (message: string) => { setToast(message); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(''), 4500); };
  const ingest = (next: AgentState) => {
    const oldAccount = priorAccount.current;
    const oldMode = priorMode.current;
    if (oldAccount !== null && (oldAccount !== next.account || oldMode !== next.mode)) { setSelectedId(''); setBody(null); setQueryResult(null); setQuery(''); }
    priorAccount.current = next.account; priorMode.current = next.mode; setState(next);
  };
  const reload = async () => {
    try { const next = await api<AgentState>('/state'); ingest(next); setError(''); }
    catch (err) { setError(readableError(err)); }
  };
  useEffect(() => {
    let active = true;
    const fetchState = async () => {
      try { const next = await api<AgentState>('/state'); if (active) { setState(next); setError((current) => current.includes('本地服务') ? '' : current); } }
      catch (err) { if (active) setError(readableError(err)); }
    };
    void fetchState();
    const timer = window.setInterval(() => { if (!document.hidden) void fetchState(); }, 15_000);
    const onVisible = () => { if (!document.hidden) void fetchState(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.clearTimeout(toastTimer.current); };
  }, []);
  useEffect(() => {
    if (!state) return;
    const accepted = state.briefs.filter((brief) => brief.status === 'accepted');
    if (initializedNotifications.current && state.settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      const fresh = accepted.find((brief) => !seenBriefIds.current.has(brief.id));
      if (fresh) new Notification('来信 · 新的邮箱简报', { body: `${fresh.mailIds.length} 封重点来信已整理，请打开本地 Agent 查看。` });
    }
    accepted.forEach((brief) => seenBriefIds.current.add(brief.id));
    initializedNotifications.current = true;
  }, [state]);

  const mutation = async (path: string, requestBody: unknown = {}, message = '', method = 'POST') => {
    if (busy) return false;
    setBusy(path); setError('');
    try { const next = await api<AgentState>(path, { method, body: requestBody }); ingest(next); if (message) notify(message); return true; }
    catch (err) { setError(readableError(err)); return false; }
    finally { setBusy(''); }
  };
  const openSettings = (tab: SettingsTab) => {
    if (!state) return;
    setDraftSettings(structuredClone(state.settings)); setSenderText(state.settings.senders.join('\n')); setKeywordText(state.settings.keywords.join('\n'));
    setModelName(state.model.model); setSettingsTab(tab);
  };
  const closeSettings = () => { setSettingsTab(null); setAuthCode(''); setModelKey(''); };
  const selected = state?.messages.find((mail) => mail.id === selectedId) ?? state?.messages.find((mail) => mail.matchReasons.length > 0) ?? state?.messages[0] ?? null;
  const matched = state?.messages.filter((mail) => mail.matchReasons.length > 0) ?? [];
  const filteredMails = useMemo(() => (state?.messages ?? []).filter((mail) => {
    if (queryResult) return queryResult.mailIds.includes(mail.id);
    if (filter === 'matched') return mail.matchReasons.length > 0;
    if (filter === 'flagged') return mail.flagged;
    return true;
  }), [state?.messages, filter, queryResult]);
  const activeTodos = state?.todos.filter((todo) => todo.status !== 'done') ?? [];
  const waiting = state?.tracking.filter((item) => item.status === 'waiting') ?? [];
  const unconfirmed = state?.briefs.filter((brief) => brief.status === 'draft').length ?? 0;
  const selectMail = (id: string) => { setSelectedId(id); setPage('inbox'); setBody(null); setUseModel(false); };
  const openMail = (id: string) => { setSelectedId(id); setPage('reader'); setBody(null); setUseModel(false); };
  const queryMails = async (text = query) => {
    if (!text.trim() || busy) return;
    setQuery(text); setBusy('query'); setError('');
    try { const result = await api<QueryResult>('/query', { method: 'POST', body: { query: text } }); setQueryResult(result); setSelectedId(result.mailIds[0] ?? ''); setBody(null); }
    catch (err) { setError(readableError(err)); setQueryResult(null); }
    finally { setBusy(''); }
  };
  const readBody = async () => {
    if (!selected || busy) return;
    setBusy('body'); setError('');
    try { const result = await api<{ text: string }>(`/messages/${encoded(selected.id)}/body`); setBody({ id: selected.id, text: result.text }); }
    catch (err) { setError(readableError(err)); }
    finally { setBusy(''); }
  };
  const extractTodo = async () => {
    if (!selected) return;
    if (await mutation('/todos/extract', { mailId: selected.id, useModel }, '已生成待办草稿，请核对原文后确认。')) { setPage('todos'); setTodoFilter('active'); }
  };
  const loadSent = async () => {
    if (busy) return;
    setSentOpen(true); setSentError(''); setSent([]); setBusy('sent');
    try { const result = await api<{ messages: Mail[]; scope?: string }>('/sent'); setSent(result.messages); if (result.scope) setSentScope(result.scope); }
    catch (err) { setSentError(readableError(err)); }
    finally { setBusy(''); }
  };
  const saveSettings = async () => {
    if (!draftSettings) return;
    const settings = { ...draftSettings, senders: splitEntries(senderText), keywords: splitEntries(keywordText) };
    if (await mutation('/settings', settings, '规则与时段已保存。', 'PUT')) { setSettingsTab(null); setQueryResult(null); }
  };
  const toggleSchedule = async (slotId: string) => {
    if (!state) return;
    const slots = state.settings.slots.map((slot) => slot.id === slotId ? { ...slot, enabled: !slot.enabled } : slot);
    const changed = slots.find((slot) => slot.id === slotId);
    if (changed) await mutation('/settings', { ...state.settings, slots }, `${slotLabels[slotId] || '简报时段'}已${changed.enabled ? '开启' : '暂停'}。`, 'PUT');
  };
  const toggleNotifications = async (checked: boolean) => {
    if (!draftSettings) return;
    if (checked) {
      if (!('Notification' in window)) { setError('此浏览器不支持桌面通知。简报仍会自动进入每日简报。'); return; }
      if (await Notification.requestPermission() !== 'granted') { setError('浏览器未允许桌面通知。你仍可在每日简报中查看定时汇报。'); return; }
    }
    setDraftSettings({ ...draftSettings, notifications: checked });
  };

  if (!state) return <div className="startup"><div className="brand-mark"><MailIcon size={30} /></div><span className="eyebrow">MAIL FOCUS 2.0</span><h1>来信，自有重点。</h1><p>{error || '正在连接你的本地 Agent…'}</p>{error ? <button className="button primary" onClick={() => void reload()}><RefreshCw size={16} />重新连接</button> : <LoaderCircle className="spin" size={24} />}<small>本地服务地址由启动终端显示。网易版与原 Outlook 版独立运行。</small></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage('inbox'); }} aria-label="来信首页"><div className="brand-mark"><MailIcon size={23} /></div><div><strong>来信</strong><small>LAIXIN AGENT</small></div></a>
      <div className={`account-card ${state.mode === 'live' ? 'live' : ''}`}><span className="account-dot" /><div><strong>{state.mode === 'live' ? '网易邮箱已连接' : '演示工作空间'}</strong><small title={state.account ?? ''}>{state.account || '使用示例邮件体验完整流程'}</small></div>{state.mode === 'live' ? <ShieldCheck size={16} /> : <button className="icon-button" aria-label="连接网易邮箱" onClick={() => openSettings('connection')}><Plus size={16} /></button>}</div>
      <div className="nav-caption">我的工作空间</div>
      <nav aria-label="主要导航">{navPages.map((id) => { const Icon = pageInfo[id].icon; const count = id === 'inbox' ? matched.length : id === 'todos' ? activeTodos.length : id === 'tracking' ? waiting.length : id === 'briefs' ? unconfirmed : 0; return <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)} aria-current={page === id ? 'page' : undefined}><Icon size={18} /><span>{pageInfo[id].name}</span>{count > 0 && <b>{count}</b>}</button>; })}</nav>
      <div className="sidebar-schedule"><div className="mini-heading"><span><Clock3 size={14} />下一次汇报</span><button className="icon-button" aria-label="修改汇报时段" onClick={() => openSettings('schedule')}><Settings2 size={14} /></button></div><strong>{state.nextRunAt ? dateTime(state.nextRunAt, true) : '暂未安排'}</strong><p>本地时间 · 上海 UTC+8</p><div className="tiny-slots">{state.settings.slots.map((slot) => <span key={slot.id} className={slot.enabled ? 'enabled' : ''}>{slot.time}</span>)}</div></div>
      <div className="sidebar-bottom"><div className="engine-note"><div><span className="pulse-dot" />本地 Harness</div><small>规则判断 · {state.model.configured ? 'DeepSeek 已就绪' : '模型可选'}</small></div><button className="nav-item" onClick={() => openSettings('rules')}><Settings2 size={18} /><span>设置与连接</span></button><a className="nav-item external-help" href="https://mail.163.com/" target="_blank" rel="noreferrer"><ExternalLink size={17} /><span>打开网易邮箱</span><ArrowRight size={14} /></a><div className="local-footnote"><ShieldCheck size={12} />运行在你的电脑上</div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumb topbar-title">你专属的个人邮件助理</div><div className="topbar-right"><button className="icon-button" aria-label="打开设置与连接" title="设置与连接" onClick={() => openSettings('rules')}><Settings2 size={18} /></button></div></header>
      <div className="content">
        <div className="page-heading"><div><span className="eyebrow">YOUR INBOX, IN FOCUS</span><h1>{pageInfo[page].name}<span className="heading-dot">.</span></h1><p>{pageInfo[page].subtitle}</p></div><div className="heading-actions">{page === 'reader' ? <button className="button secondary" onClick={() => setPage('inbox')}><ArrowRight size={15} />返回重点收件箱</button> : <><button className="button secondary" disabled={!!busy} onClick={() => void mutation('/sync', {}, '邮箱同步完成。')}><RefreshCw size={15} className={busy === '/sync' ? 'spin' : ''} />同步邮箱</button><button className="button primary" disabled={!!busy} onClick={() => { void mutation('/run', {}, '简报草稿已生成，可在每日简报中确认。').then((ok) => { if (ok) setPage('briefs'); }); }}>{busy === '/run' ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}生成简报</button></>}</div></div>
        {state.mode === 'demo' && <div className="demo-banner"><div className="banner-icon"><Radio size={19} /></div><div><strong>这是独立的网易版 Agent，当前展示示例邮件</strong><p>连接你的网易邮箱后，读取、红旗和回复追踪才会作用于真实邮件。</p></div><button className="button compact" onClick={() => openSettings('connection')}>连接我的邮箱<ArrowRight size={15} /></button></div>}
        {error && <div className="alert error" role="alert"><AlertCircle size={18} /><div><strong>操作未完成</strong><p>{error}</p></div><button className="icon-button" aria-label="关闭错误提示" onClick={() => setError('')}><X size={16} /></button></div>}
        {state.sync.error && <div className="alert warning" role="status"><AlertCircle size={17} /><div><strong>邮箱同步需要处理</strong><p>{state.sync.error} · 当前保留的是上次成功同步的数据。</p></div><button className="text-button" onClick={() => openSettings('connection')}>检查连接</button></div>}

        {page === 'inbox' && <>
          <div className="stats-grid"><div className="stat-card"><span>重点来信<Inbox size={16} /></span><strong>{matched.length}<small>封</small></strong><p>发件人、主题规则或已追踪回复</p></div><div className="stat-card"><span>等待回音<Send size={16} /></span><strong>{waiting.length}<small>封</small></strong><button className="stat-link" onClick={() => setPage('tracking')}>查看已投递邮件<ArrowRight size={13} /></button></div><div className="stat-card"><span>待安排事项<ListTodo size={16} /></span><strong>{activeTodos.length}<small>项</small></strong><button className="stat-link" onClick={() => setPage('todos')}>核对面试与待办<ArrowRight size={13} /></button></div></div>
          <div className="ask-box"><form onSubmit={(event) => { event.preventDefault(); void queryMails(); }}><MessageSquareText size={20} /><input aria-label="询问邮箱" placeholder="问问来信：今天有关于面试的邮件吗？" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="button ask-submit" type="submit" disabled={!!busy || !query.trim()}>{busy === 'query' ? <LoaderCircle className="spin" size={16} /> : <ArrowRight size={17} />}<span>查询</span></button></form><div className="ask-suggestions"><span>试着问</span>{['今天有什么新邮件', '关于面试的邮件', '未读邮件'].map((text) => <button key={text} onClick={() => void queryMails(text)} disabled={!!busy}>{text}<ArrowUpIcon /></button>)}</div></div>
          {queryResult && <div className="query-answer" role="status"><Search size={17} /><div><strong>{queryResult.interpretation}</strong><p>{queryResult.mailIds.length} 封匹配 · {queryResult.scope}{queryResult.warning ? ` · ${queryResult.warning}` : ''}</p></div><button className="text-button" onClick={() => { setQueryResult(null); setQuery(''); }}>清除查询<X size={13} /></button></div>}
          <div className="inbox-workspace"><section className="mail-list-panel" aria-label="邮件列表"><div className="panel-toolbar"><div className="filter-tabs" role="group" aria-label="邮件筛选">{([{ id: 'matched', label: '重点' }, { id: 'all', label: '全部' }, { id: 'flagged', label: '红旗' }] as const).map((tab) => <button key={tab.id} className={filter === tab.id && !queryResult ? 'active' : ''} onClick={() => { setFilter(tab.id); setQueryResult(null); }}>{tab.label}</button>)}</div><span className="count-label">{filteredMails.length} 封</span></div><div className="mail-list">
            {filteredMails.length ? filteredMails.map((mail, index) => <button key={mail.id} className={`mail-item ${selectedId === mail.id ? 'selected' : ''}`} onClick={() => selectMail(mail.id)} aria-pressed={selectedId === mail.id}><div className={`sender-avatar hue-${index % 4}`}>{initialLetters(mail.sender)}</div><div className="mail-item-content"><div className="mail-meta"><strong>{mail.sender || mail.address}</strong><time>{dateTime(mail.receivedAt, true)}</time></div><div className="mail-subject">{mail.unread && <span className="unread-dot" />}{mail.subject || '（无主题）'}</div><p>{mail.preview || '选择邮件后可读取正文'}</p><div className="mail-tags">{mail.replyToTrackedId && <Tag tone="mint">投递回信</Tag>}{mail.matchReasons.slice(0, 2).map((reason) => <Tag key={reason}>{reason}</Tag>)}{mail.flagged && <Flag size={13} className="flagged" fill="currentColor" />}</div></div></button>) : <Empty title={queryResult ? '在当前同步范围内没有找到' : '这里暂时没有邮件'} text={queryResult ? '可更换主题、发件人或时间条件后重新查询。' : '试试切换“全部”，或在设置中添加关注主体与主题关键词。'} action={<button className="button secondary compact" onClick={() => openSettings('rules')}>查看关注规则</button>} />}
          </div><div className="sync-footnote"><RefreshCw size={12} /><span>{state.sync.scope || '同步范围待确认'}<br />上次同步：{dateTime(state.sync.lastAt, true)}{state.sync.partial ? ' · 结果不完整' : ''}</span></div></section>
          <MailReader selected={selected} state={state} body={body} busy={busy} useModel={useModel} onUseModel={setUseModel} onFlag={setFlagTarget} onReadBody={() => void readBody()} onExtractTodo={() => void extractTodo()} onOpenSettings={openSettings} /></div>
        </>}

        {page === 'reader' && <div className="standalone-reader"><MailReader selected={selected} state={state} body={body} busy={busy} useModel={useModel} onUseModel={setUseModel} onFlag={setFlagTarget} onReadBody={() => void readBody()} onExtractTodo={() => void extractTodo()} onOpenSettings={openSettings} onBack={() => setPage('inbox')} /></div>}

        {page === 'todos' && <><div className="page-info-bar"><div><ShieldCheck size={17} /><p>提取结果先进入草稿。缺失的信息留空，确认前请打开原邮件核对。</p></div><button className="button secondary compact" onClick={() => setPage('inbox')}><Plus size={15} />从邮件创建</button></div><div className="section-heading"><div className="filter-tabs"><button className={todoFilter === 'active' ? 'active' : ''} onClick={() => setTodoFilter('active')}>待处理 {activeTodos.length}</button><button className={todoFilter === 'done' ? 'active' : ''} onClick={() => setTodoFilter('done')}>已完成 {state.todos.filter((todo) => todo.status === 'done').length}</button></div><span className="quiet">所有时间均应与邮件原文核对</span></div><div className="todo-grid">{state.todos.filter((todo) => todoFilter === 'done' ? todo.status === 'done' : todo.status !== 'done').map((todo) => <article className={`todo-card ${todo.status}`} key={todo.id}><div className="todo-top"><Tag tone={todo.status === 'draft' ? 'amber' : todo.status === 'done' ? '' : 'mint'}>{todo.status === 'draft' ? '待核对草稿' : todo.status === 'confirmed' ? '已确认待办' : '已完成'}</Tag><div><button className="icon-button" aria-label="编辑待办" onClick={() => setTodoEdit({ ...todo })}><Pencil size={15} /></button><button className="icon-button" aria-label="删除本地待办" disabled={!!busy} onClick={() => void mutation(`/todos/${encoded(todo.id)}`, undefined, '本地待办已删除，邮件没有被删除。', 'DELETE')}><Trash2 size={15} /></button></div></div><div className="todo-company-icon"><Building2 size={22} /></div><h3>{todo.company || '公司待补充'}</h3><p className="todo-role"><BriefcaseBusiness size={14} />{todo.role || '岗位待补充'}</p><div className={`todo-time ${!todo.time ? 'missing' : ''}`}><CalendarDays size={16} /><span>{todo.time || '时间待核对，请查看原文'}</span></div>{safeUrl(todo.link) ? <a className="todo-link" href={safeUrl(todo.link)} target="_blank" rel="noreferrer"><Link2 size={14} />打开会议 / 面试链接<ExternalLink size={12} /></a> : <div className="todo-link missing"><Link2 size={14} />链接待补充</div>}{todo.notes && <p className="todo-notes">{todo.notes}</p>}<div className="todo-bottom">{todo.status === 'draft' ? <button className="button primary compact" onClick={() => setTodoEdit({ ...todo })}><Check size={15} />核对并确认</button> : <button className="button secondary compact" disabled={!!busy} onClick={() => void mutation(`/todos/${encoded(todo.id)}`, { company: todo.company, role: todo.role, time: todo.time, link: todo.link, notes: todo.notes, status: todo.status === 'done' ? 'confirmed' : 'done' }, todo.status === 'done' ? '已恢复为待办。' : '已标记完成。', 'PUT')}>{todo.status === 'done' ? <RefreshCw size={14} /> : <CheckCheck size={15} />}{todo.status === 'done' ? '恢复待办' : '标记完成'}</button>}<button className="text-button" onClick={() => openMail(todo.mailId)}>回到邮件<ArrowRight size={13} /></button></div></article>)}</div>{!state.todos.some((todo) => todoFilter === 'done' ? todo.status === 'done' : todo.status !== 'done') && <div className="surface"><Empty icon={<ListTodo size={30} />} title={todoFilter === 'done' ? '完成的事项会收在这里' : '让面试安排从邮件里走出来'} text="在重点收件箱中选择一封邮件，点击“生成待办草稿”，核对后加入你的面板。" action={<button className="button primary compact" onClick={() => setPage('inbox')}>去选择邮件<ArrowRight size={14} /></button>} /></div>}</>}

        {page === 'tracking' && <><div className="tracking-intro"><div className="tracking-illustration"><Send size={30} /><span className="orbit-dot" /></div><div><span className="eyebrow">WAITING FOR A REPLY</span><h2>关注你发出去的那一封</h2><p>从已发送邮件中选择投递或联络邮件。Agent 依据回复邮件的关联标识确认回信；仅主题相似不会被当成已经回复。</p></div><button className="button primary" disabled={!!busy} onClick={() => void loadSent()}><Plus size={16} />添加回复追踪</button></div><div className="tracking-list">{state.tracking.map((track) => <article key={track.id} className="tracking-item"><div className={`tracking-symbol ${track.status}`}>{track.status === 'replied' ? <MailCheck size={21} /> : <Clock3 size={21} />}</div><div className="tracking-content"><div><Tag tone={track.status === 'replied' ? 'mint' : 'amber'}>{track.status === 'replied' ? `收到 ${track.replyIds.length} 封回复` : '等待回信'}</Tag><time>开始追踪 {dateTime(track.createdAt, true)}</time></div><h3>{track.subject}</h3><p>收件人：{track.recipient}</p>{track.replyIds.length > 0 && <div className="reply-links">{track.replyIds.map((id, index) => <button className="text-button" key={id} onClick={() => openMail(id)}>查看回复 {index + 1}<ArrowRight size={12} /></button>)}</div>}</div><button className="icon-button" aria-label={`停止追踪 ${track.subject}`} title="停止追踪（不会删除邮件）" disabled={!!busy} onClick={() => void mutation(`/tracking/${encoded(track.id)}`, undefined, '已停止追踪，邮件未被改动。', 'DELETE')}><X size={17} /></button></article>)}</div>{!state.tracking.length && <div className="surface"><Empty icon={<Send size={29} />} title="重要的投递，值得等一个回音" text="先选择一封已发出的简历或联络邮件，再开始追踪。新回复会出现在重点收件箱与简报中。" /></div>}<div className="plain-note"><CircleHelp size={15} /><p>追踪范围与当前邮箱同步范围一致。对方新开一封邮件、移除关联标识，或回复不在同步范围内时，可能无法自动关联；可同时添加该发件人或主题关键词作为补充。</p></div></>}

        {page === 'briefs' && <><div className="schedule-grid">{state.settings.slots.map((slot, index) => { const Icon = slotIcons[index % slotIcons.length]; return <article className={`schedule-card ${slot.enabled ? '' : 'disabled'}`} key={slot.id}><div><Icon size={20} /><button className={`toggle schedule-toggle ${slot.enabled ? 'on' : ''}`} type="button" role="switch" aria-checked={slot.enabled} aria-label={`${slot.enabled ? '暂停' : '开启'}${slotLabels[slot.id] || slot.id}`} onClick={() => void toggleSchedule(slot.id)} disabled={!!busy}><span /></button></div><h3>{slotLabels[slot.id] || `第 ${index + 1} 次简报`}</h3><strong>{slot.time}</strong><p>亚洲 / 上海 UTC+8<button className="icon-button" aria-label={`修改${slotLabels[slot.id] || '简报'}时间`} onClick={() => openSettings('schedule')}><Settings2 size={13} /></button></p></article>; })}</div><div className="plain-note"><Clock3 size={15} /><p>定时简报会自动进入此面板。关闭网页仍可生成，但电脑必须唤醒、本地服务持续运行且邮箱保持连接；服务重启后请重新输入授权码。浏览器桌面提醒只在页面打开时生效。</p></div><div className="section-heading"><h2>简报收件夹<span>{state.briefs.filter((brief) => brief.status !== 'discarded').length}</span></h2><div className="filter-tabs"><button className={briefFilter === 'active' ? 'active' : ''} onClick={() => setBriefFilter('active')}>有效简报</button><button className={briefFilter === 'all' ? 'active' : ''} onClick={() => setBriefFilter('all')}>全部记录</button></div></div><div className="brief-list">{state.briefs.filter((brief) => briefFilter === 'all' || brief.status !== 'discarded').map((brief) => <article key={brief.id} className={`brief-card ${brief.status}`}><div className="brief-icon"><FileText size={24} /></div><div className="brief-content"><div className="brief-meta"><span>{brief.source === 'schedule' ? '定时汇报' : '手动汇报'} · {dateTime(brief.createdAt)}</span><Tag tone={brief.status === 'draft' ? 'amber' : brief.status === 'accepted' ? 'mint' : ''}>{brief.status === 'draft' ? '待确认草稿' : brief.status === 'accepted' ? '已归档' : '已放弃'}</Tag></div><h3>{brief.mailIds.length ? `${brief.mailIds.length} 封值得关注的来信` : '这一轮没有新增重点邮件'}</h3><p className="brief-summary">{brief.summary}</p><div className="brief-mail-links">{brief.mailIds.map((id) => { const source = state.messages.find((mail) => mail.id === id); return <button key={id} onClick={() => openMail(id)}><MailIcon size={13} /><span>{source?.subject || '查看关联邮件'}</span><ChevronRight size={12} /></button>; })}</div>{brief.status === 'draft' && <div className="brief-actions"><button className="button primary compact" disabled={!!busy} onClick={() => void mutation(`/briefs/${encoded(brief.id)}/accept`, {}, '简报已确认归档。')}><Check size={14} />确认归档</button><button className="button secondary compact" disabled={!!busy} onClick={() => void mutation(`/briefs/${encoded(brief.id)}/discard`, {}, '已放弃这份草稿。')}>放弃草稿</button></div>}</div></article>)}</div>{!state.briefs.some((brief) => briefFilter === 'all' || brief.status !== 'discarded') && <div className="surface"><Empty icon={<FileText size={30} />} title="下一份简报，从这一刻开始" text="点击右上角“生成简报”，或等待已设置的汇报时段。每封邮件会去重，避免反复打扰。" /></div>}</>}

        {page === 'runs' && <><div className="harness-overview"><div><span className="eyebrow">A SMALL, EXPLICIT HARNESS</span><h2>看得见 Agent 怎样工作</h2><p>读取限定范围 → 执行关注规则 → 关联回复 → 去重整理 → 生成结果。写入红旗与确认待办保留你的控制权。</p></div><div className="harness-chain">{['触发', '读取', '判断', '核对', '记录'].map((item, index) => <span key={item}>{index > 0 && <ChevronRight size={13} />}<b>{item}</b></span>)}</div></div><div className="runs-list">{state.runs.map((run, index) => <details key={run.id} className="run-card" open={index === 0}><summary><div className={`run-status ${run.error || /fail|error/i.test(run.status) ? 'failed' : ''}`}>{run.error || /fail|error/i.test(run.status) ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}</div><div><strong>{run.trigger}</strong><span>{dateTime(run.at)}</span></div><Tag tone={run.error || /fail|error/i.test(run.status) ? 'red' : 'mint'}>{run.status}</Tag><ChevronRight size={16} className="details-chevron" /></summary><div className="run-steps">{run.steps.map((step, stepIndex) => <div className="run-step" key={`${step.name}-${stepIndex}`}><span className="step-number">{String(stepIndex + 1).padStart(2, '0')}</span><div><strong>{step.name}<small>{step.status}</small></strong><p>{step.detail}</p></div></div>)}{run.error && <div className="alert error"><AlertCircle size={16} /><p>{run.error}</p></div>}</div></details>)}</div>{!state.runs.length && <div className="surface"><Empty icon={<Activity size={30} />} title="运行之后，这里会留下依据" text="同步邮箱、生成简报或整理待办后，可在这里查看具体执行步骤与失败原因。" /></div>}</>}
        {page === 'agent' && <AgentTasks mails={state.messages} modelConfigured={state.model.configured} mode={state.mode} onOpenMail={openMail} onOpenTodos={() => setPage('todos')} onStateChanged={() => void reload()} />}
        <footer className="page-footer"><span>来信<span>·</span>个人网易邮箱 Agent</span><span><ShieldCheck size={12} />独立工作空间 · 邮箱授权码仅在服务内存中保留</span></footer>
      </div>
    </main>

    {settingsTab && draftSettings && <Dialog title="设置与连接" description="把你关心的来信，交给清晰可控的规则。" onClose={closeSettings} wide><div className="settings-tabs" role="tablist" aria-label="设置分类">{([{ id: 'connection', name: '邮箱连接', icon: MailIcon }, { id: 'rules', name: '关注规则', icon: Settings2 }, { id: 'schedule', name: '汇报时段', icon: Clock3 }, { id: 'model', name: 'DeepSeek', icon: Sparkles }] as const).map((tab) => <button key={tab.id} role="tab" aria-selected={settingsTab === tab.id} onClick={() => setSettingsTab(tab.id)} className={settingsTab === tab.id ? 'active' : ''}><tab.icon size={16} />{tab.name}</button>)}</div><div className="settings-content">
      {settingsTab === 'connection' && <><div className={`connection-status ${state.connected ? 'connected' : ''}`}><div className="connection-status-icon">{state.connected ? <ShieldCheck size={25} /> : <MailIcon size={25} />}</div><div><h3>{state.connected ? '真实邮箱已连接' : '连接你的网易邮箱'}</h3><p>{state.account || '支持 163.com、126.com 与 yeah.net 个人邮箱。'}</p></div>{state.connected && <Tag tone="mint">TLS 安全连接</Tag>}</div>{state.connected ? <><div className="setup-note"><p>当前账号：<strong>{state.account}</strong></p><p>授权码只在本地服务的内存中保留。断开或重启服务后，需要重新连接。</p><p>Agent 不发送、转发或删除邮件；红旗操作会在你确认后写回邮箱。</p></div><button className="button danger" disabled={!!busy} onClick={() => void mutation('/disconnect', {}, '真实邮箱已断开，当前切回独立演示空间。')}><Unplug size={16} />断开真实邮箱</button></> : <><div className="setup-steps"><h4>第一次连接，需要准备邮箱授权码</h4><ol><li>打开网易邮箱，进入「设置 → POP3/SMTP/IMAP」。</li><li>开启 <strong>IMAP/SMTP 服务</strong>，按网易要求完成验证。</li><li>生成客户端<strong>授权码</strong>，在下方输入。这里不用邮箱登录密码。</li></ol><a className="text-button" href="https://mail.163.com/" target="_blank" rel="noreferrer">去网易邮箱设置<ExternalLink size={13} /></a></div><form onSubmit={(event) => { event.preventDefault(); void mutation('/connect', { email: email.trim(), authCode: authCode.trim() }, '网易邮箱已连接，已切换到真实数据。').then((ok) => { if (ok) { setAuthCode(''); setSettingsTab(null); } }); }}><label className="field"><span>网易邮箱地址</span><input autoComplete="username" type="email" placeholder="你的邮箱@163.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="field"><span>客户端授权码</span><div className="secret-input"><input autoComplete="off" type={showAuthCode ? 'text' : 'password'} placeholder="输入网易生成的授权码" value={authCode} onChange={(event) => setAuthCode(event.target.value)} required /><button type="button" className="icon-button" aria-label={showAuthCode ? '隐藏授权码' : '显示授权码'} onClick={() => setShowAuthCode(!showAuthCode)}>{showAuthCode ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><div className="security-note"><ShieldCheck size={15} /><p>授权码只发送到你电脑上的本地服务，不会写入浏览器存储或上传给 DeepSeek。服务重启后需要重新输入。</p></div><button className="button primary full-width" disabled={!!busy || !email.trim() || !authCode.trim()} type="submit">{busy === '/connect' ? <LoaderCircle className="spin" size={16} /> : <Link2 size={16} />}{busy === '/connect' ? '正在验证连接…' : '连接并读取我的邮箱'}</button></form></>}</>}
      {settingsTab === 'rules' && <><div className="setting-description"><Settings2 size={22} /><div><h3>只关注你定义的重点</h3><p>满足任一发件人或主题规则即可入选。已追踪邮件的可靠回复也会进入重点收件箱。</p></div></div><label className="field"><span>关注的发件人<span className="field-hint">每行一个完整邮箱地址</span></span><textarea rows={5} placeholder={'hr@example.com\nmentor@example.edu'} value={senderText} onChange={(event) => setSenderText(event.target.value)} /><small>按实际发件邮箱精确匹配，不依赖显示名称。大小写不敏感。</small></label><label className="field"><span>邮件主题关键词<span className="field-hint">每行一个关键词</span></span><textarea rows={4} placeholder={'面试\ninterview\n发票'} value={keywordText} onChange={(event) => setKeywordText(event.target.value)} /><small>只匹配邮件主题中包含的文字，不区分大小写；支持逗号分隔。</small></label><div className="rule-example"><span className="eyebrow">MATCH LOGIC</span><p>发件人在列表中 <b>或</b> 主题包含关键词 <b>或</b> 是已追踪邮件的回复<ArrowRight size={14} /><strong>重点来信</strong></p></div><button className="button primary full-width" disabled={!!busy} onClick={() => void saveSettings()}><Check size={16} />保存关注规则</button></>}
      {settingsTab === 'schedule' && <><div className="setting-description"><Clock3 size={22} /><div><h3>每天三次，刚好够用</h3><p>按上海时间运行，可调整时间或暂停单个时段。</p></div></div><div className="schedule-settings">{draftSettings.slots.map((slot, index) => { const Icon = slotIcons[index % slotIcons.length]; return <div key={slot.id}><Icon size={21} /><label><strong>{slotLabels[slot.id] || `第 ${index + 1} 次简报`}</strong><span>{slot.enabled ? '按时整理新增重点邮件' : '此时段已暂停'}</span></label><input aria-label={`${slotLabels[slot.id] || slot.id}时间`} type="time" value={slot.time} onChange={(event) => setDraftSettings({ ...draftSettings, slots: draftSettings.slots.map((s) => s.id === slot.id ? { ...s, time: event.target.value } : s) })} required /><button className={`toggle ${slot.enabled ? 'on' : ''}`} type="button" role="switch" aria-checked={slot.enabled} aria-label={`开启${slotLabels[slot.id] || slot.id}`} onClick={() => setDraftSettings({ ...draftSettings, slots: draftSettings.slots.map((s) => s.id === slot.id ? { ...s, enabled: !s.enabled } : s) })}><span /></button></div>; })}</div><label className="notification-setting"><Bell size={20} /><span><strong>浏览器桌面提醒</strong><small>页面打开且浏览器允许通知时，提醒你查看新简报。</small></span><input type="checkbox" checked={draftSettings.notifications} onChange={(event) => void toggleNotifications(event.target.checked)} /></label><div className="setup-note"><h4>定时任务在哪里运行？</h4><p>本地 Node 服务负责调度，网页关闭后仍会生成简报并持久保存到本地。电脑休眠、关机或服务停止期间不会运行；恢复后以运行记录为准。</p><p>汇报入口是本工具的「每日简报」，没有自动给其他人发邮件。</p></div><button className="button primary full-width" disabled={!!busy} onClick={() => void saveSettings()}><Check size={16} />保存汇报时段</button></>}
      {settingsTab === 'model' && <><div className="setting-description"><Sparkles size={23} /><div><h3>用自己的 DeepSeek API Key</h3><p>可选的内容整理能力。重点筛选、查询和邮箱操作仍由本地 Harness 控制。</p></div></div><div className={`model-status ${state.model.configured ? 'configured' : ''}`}><span className="account-dot" /><strong>{state.model.configured ? 'Key 已配置在本地服务内存中' : '尚未配置 · 本地规则模式可直接使用'}</strong></div><label className="field"><span>模型名称</span><input value={modelName} onChange={(event) => setModelName(event.target.value)} placeholder="deepseek-v4-flash" /><small>接口固定为 https://api.deepseek.com，使用 Chat Completions。</small></label><label className="field"><span>DeepSeek API Key</span><input type="password" value={modelKey} onChange={(event) => setModelKey(event.target.value)} placeholder={state.model.configured ? '输入新的 Key 可替换当前配置' : 'sk-…'} autoComplete="off" /></label><div className="security-note"><KeyRound size={16} /><p>Key 只交给本地后端，不存浏览器或磁盘。每次提取时，你需要明确勾选允许发送该封邮件；未勾选则完全在本地按规则整理。</p></div><div className="inline-actions"><button className="button primary" disabled={!!busy || !modelKey.trim() || !modelName.trim()} onClick={() => void mutation('/model', { apiKey: modelKey.trim(), model: modelName.trim() }, 'DeepSeek Key 已保存在本地服务内存中。', 'PUT').then((ok) => { if (ok) setModelKey(''); })}><KeyRound size={15} />保存 Key</button><button className="button secondary" disabled={!!busy || !state.model.configured} onClick={async () => { setBusy('test-model'); setError(''); try { const result = await api<{ ok: boolean; error?: string }>('/model/test', { method: 'POST', body: {} }); if (!result.ok) throw new Error(result.error || '连接测试未通过'); notify('DeepSeek 连接测试成功。'); } catch (err) { setError(readableError(err)); } finally { setBusy(''); } }}>{busy === 'test-model' ? <LoaderCircle className="spin" size={15} /> : <Activity size={15} />}测试连接</button></div><small className="quiet">测试仅发送简短测试提示词，会产生少量 API 用量；不会发送邮箱内容。</small></>}
      {error && <div className="alert error inline-error" role="alert"><AlertCircle size={16} /><p>{error}</p></div>}
    </div></Dialog>}

    {flagTarget && <Dialog title={flagTarget.flagged ? '取消这封邮件的红旗？' : '将这封邮件设为红旗？'} onClose={() => setFlagTarget(null)}><div className="confirmation-mail"><Flag size={24} className="flagged" /><div><strong>{flagTarget.subject}</strong><p>{flagTarget.address}</p></div></div><p className="dialog-body-copy">{state.mode === 'live' ? '确认后，Agent 会将这个改动写回你的网易邮箱。仅修改红旗，不改动正文、已读状态或其他邮件。' : '当前处于演示模式，只会改动这封示例邮件的红旗状态。'}</p><div className="dialog-actions"><button className="button secondary" onClick={() => setFlagTarget(null)}>取消</button><button className="button primary" disabled={!!busy} onClick={() => void mutation(`/messages/${encoded(flagTarget.id)}/flag`, { flagged: !flagTarget.flagged, confirmed: true }, flagTarget.flagged ? '已取消红旗。' : '已设为红旗。').then((ok) => { if (ok) setFlagTarget(null); })}><Flag size={15} />{flagTarget.flagged ? '确认取消红旗' : '确认设为红旗'}</button></div>{error && <div className="alert error" role="alert"><p>{error}</p></div>}</Dialog>}

    {todoEdit && <Dialog title="核对待办信息" description="模型和规则都会有遗漏，请对照邮件原文确认。" onClose={() => setTodoEdit(null)} wide><div className="todo-form"><div className="two-fields"><label className="field"><span>公司</span><input value={todoEdit.company} onChange={(event) => setTodoEdit({ ...todoEdit, company: event.target.value })} placeholder="原文未提供，可手动补充" /></label><label className="field"><span>岗位</span><input value={todoEdit.role} onChange={(event) => setTodoEdit({ ...todoEdit, role: event.target.value })} placeholder="原文未提供，可手动补充" /></label></div><label className="field"><span>面试 / 截止时间</span><input value={todoEdit.time} onChange={(event) => setTodoEdit({ ...todoEdit, time: event.target.value })} placeholder="例如 2026-09-15 14:00（北京时间）" /><small>保留原文时区。时间不明确时请人工确认，不要凭空推断。</small></label><label className="field"><span>会议或面试链接</span><input type="url" value={todoEdit.link} onChange={(event) => setTodoEdit({ ...todoEdit, link: event.target.value })} placeholder="https://…" /></label><label className="field"><span>备注 / 要准备的材料</span><textarea rows={3} value={todoEdit.notes} onChange={(event) => setTodoEdit({ ...todoEdit, notes: event.target.value })} /></label><div className="source-evidence"><span className="section-kicker">邮件原文依据 · {todoEdit.source === 'deepseek' ? 'DeepSeek 提取' : '本地规则提取'}</span><pre>{todoEdit.evidence || '暂无引用依据，请打开源邮件核对。'}</pre></div><div className="dialog-actions"><button className="text-button" onClick={() => { openMail(todoEdit.mailId); setTodoEdit(null); }}>返回原邮件 / 重新提取<ArrowRight size={13} /></button><button className="button secondary" disabled={!!busy} onClick={() => void mutation(`/todos/${encoded(todoEdit.id)}`, { company: todoEdit.company, role: todoEdit.role, time: todoEdit.time, link: todoEdit.link, notes: todoEdit.notes, status: todoEdit.status }, '待办修改已保存。', 'PUT').then((ok) => { if (ok) setTodoEdit(null); })}>保存修改</button><button className="button primary" disabled={!!busy} onClick={() => void mutation(`/todos/${encoded(todoEdit.id)}`, { company: todoEdit.company, role: todoEdit.role, time: todoEdit.time, link: todoEdit.link, notes: todoEdit.notes, status: 'confirmed' }, '已确认加入待办面板。', 'PUT').then((ok) => { if (ok) setTodoEdit(null); })}><Check size={15} />确认加入待办</button></div>{error && <div className="alert error" role="alert"><p>{error}</p></div>}</div></Dialog>}

    {sentOpen && <Dialog title="选择一封已发送邮件" description="只会追踪你选择的邮件，不发送新邮件。" onClose={() => setSentOpen(false)} wide><div className="sent-scope"><ShieldCheck size={14} />{sentScope}</div>{busy === 'sent' ? <div className="loading-panel"><LoaderCircle className="spin" size={23} /><p>正在读取已发送邮件…</p></div> : sentError ? <div className="alert error"><AlertCircle size={16} /><p>{sentError}</p><button className="text-button" onClick={() => void loadSent()}>重试</button></div> : <div className="sent-list">{sent.map((mail) => { const exists = state.tracking.some((track) => track.messageId === mail.messageId); return <div className="sent-item" key={mail.id}><div className="sender-avatar"><Send size={17} /></div><div><strong>{mail.subject}</strong><p>收件人：{Array.isArray(mail.to) ? mail.to.join('、') : mail.to || mail.address}</p><small>{dateTime(mail.receivedAt, true)}</small></div><button className="button secondary compact" disabled={!!busy || exists} onClick={() => void mutation('/tracking', { mailId: mail.id }, '已开始追踪这封邮件的回复。').then((ok) => { if (ok) setSentOpen(false); })}>{exists ? <Check size={14} /> : <Plus size={14} />}{exists ? '已追踪' : '追踪'}</button></div>; })}{!sent.length && <Empty icon={<Send size={26} />} title="当前范围内没有已发送邮件" text="确认邮箱中存在已发送邮件，并在邮件同步后重试。" />}</div>}{error && <div className="alert error" role="alert"><p>{error}</p></div>}</Dialog>}
    {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}<button className="icon-button" aria-label="关闭提示" onClick={() => setToast('')}><X size={14} /></button></div>}
    {busy && <div className="busy-indicator" role="status"><LoaderCircle className="spin" size={13} />Agent 正在处理</div>}
  </div>;
}

function ArrowUpIcon() { return <svg aria-hidden="true" width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 9 9 3M3 3h6v6" stroke="currentColor" strokeWidth="1.2" /></svg>; }
