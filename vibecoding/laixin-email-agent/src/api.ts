export type Settings = {
  senders: string[];
  keywords: string[];
  slots: { id: string; time: string; enabled: boolean }[];
  timezone: 'Asia/Shanghai';
  notifications: boolean;
};
export type Mail = {
  id: string;
  sender: string;
  address: string;
  subject: string;
  preview: string;
  receivedAt: string;
  flagged: boolean;
  unread: boolean;
  matchReasons: string[];
  replyToTrackedId?: string;
  to?: string | string[];
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
};
export type Todo = {
  id: string; mailId: string; company: string; role: string; time: string;
  link: string; notes: string; evidence: string;
  status: 'draft' | 'confirmed' | 'done'; source: 'rules' | 'deepseek';
};
export type Brief = {
  id: string; createdAt: string; source: 'manual' | 'schedule';
  status: 'draft' | 'accepted' | 'discarded'; mailIds: string[]; summary: string;
};
export type Run = {
  id: string; at: string; trigger: string; status: string;
  steps: { name: string; status: string; detail: string }[]; error?: string;
};
export type Tracking = {
  id: string; messageId: string; subject: string; recipient: string;
  createdAt: string; status: 'waiting' | 'replied'; replyIds: string[];
};
export type AgentState = {
  mode: 'demo' | 'live'; connected: boolean; account: string | null;
  settings: Settings; messages: Mail[]; todos: Todo[]; briefs: Brief[]; runs: Run[]; tracking: Tracking[];
  sync: { lastAt: string | null; error: string | null; scope: string; partial: boolean };
  model: { configured: boolean; model: string }; nextRunAt: string | null;
};
export type QueryResult = { interpretation: string; warning?: string; mailIds: string[]; scope: string };

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: 'same-origin', signal: controller.signal,
    });
    const text = await response.text();
    let payload: unknown;
    try { payload = text ? JSON.parse(text) : {}; }
    catch { throw new Error('本地服务没有返回有效数据，请确认 Agent 服务正在运行。'); }
    if (!response.ok) {
      throw new Error((payload as { error?: string }).error || `请求失败（${response.status}）`);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('请求超时。请检查邮箱连接后重试，当前数据已保留。', { cause: error });
    if (error instanceof TypeError) throw new Error('暂时无法连接本地服务。请确认电脑上的 Agent 进程仍在运行。', { cause: error });
    throw error;
  } finally { window.clearTimeout(timeout); }
}

export const encoded = (id: string) => encodeURIComponent(id);
export const readableError = (error: unknown) => error instanceof Error ? error.message : '操作没有完成，请稍后重试。';
export const safeUrl = (value: string) => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
