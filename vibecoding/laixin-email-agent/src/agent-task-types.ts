import type { Mail } from './api';

export type AgentTaskStatus = 'awaiting_start' | 'running' | 'needs_input' | 'awaiting_approval' | 'completed' | 'cancelled' | 'failed' | 'interrupted';
export type AgentEventType = 'plan' | 'tool' | 'observation' | 'replan' | 'approval' | 'finish' | 'error';
export type AgentEvent = { id: string; at: string; type: AgentEventType; title: string; detail: string; tool?: string; status?: string };
export type PendingAction = { id: string; type: 'flag'; mailId: string; subject: string; address: string; flagged: boolean; status: 'pending' | 'approved' | 'rejected' | 'failed' };
export type AgentTask = {
  id: string; goal: string; createdAt: string; updatedAt: string; mode: 'demo' | 'live'; planner: 'rules' | 'deepseek'; useModel: boolean;
  status: AgentTaskStatus; plan: string[]; events: AgentEvent[];
  result: { summary: string; mailIds: string[]; todoIds: string[] };
  question?: string; pendingActions: PendingAction[];
  budgets: { maxSteps: number; steps: number; maxModelCalls: number; modelCalls: number }; warning?: string;
};

export type AgentTasksProps = {
  mails: Mail[];
  modelConfigured: boolean;
  mode: 'demo' | 'live';
  onOpenMail: (mailId: string) => void;
  onOpenTodos: () => void;
  onStateChanged: () => void;
};
