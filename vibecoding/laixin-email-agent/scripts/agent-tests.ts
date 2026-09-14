import assert from 'node:assert/strict';
import {
  classifyMail,
  createDigest,
  parseQuery,
  safeRead,
  safeWrite,
  setFlaggedById,
  type AgentSettings,
  type MailRecord,
} from '../src/agent.ts';

const settings: AgentSettings = {
  senderAllowlist: ['office@school.edu'],
  slots: [{ id: 'morning', label: '早报', time: '08:00', enabled: true }],
  timezone: 'UTC',
};

const mails: MailRecord[] = [
  { id: 'sender', sender: 'Office', address: 'office@school.edu', subject: 'Notice', preview: '', receivedAt: '2026-09-12T08:00:00Z', importance: false, flagged: false, unread: true },
  { id: 'seminar', sender: 'Lab', address: 'lab@school.edu', subject: 'Topic Seminar: AI', preview: '', receivedAt: '2026-09-12T09:00:00Z', importance: false, flagged: false, unread: true },
  { id: 'both', sender: 'Office', address: 'office@school.edu', subject: 'Seminar reminder', preview: '', receivedAt: '2026-09-12T10:00:00Z', importance: true, flagged: false, unread: true },
  { id: 'flag-only', sender: 'Friend', address: 'friend@school.edu', subject: 'Lunch', preview: '', receivedAt: '2026-09-12T11:00:00Z', importance: false, flagged: true, unread: true },
  { id: 'yesterday', sender: 'Office', address: 'office@school.edu', subject: 'Old notice', preview: '', receivedAt: '2026-09-11T08:00:00Z', importance: false, flagged: false, unread: false },
];

assert.deepEqual(classifyMail(mails[2], settings), ['sender', 'seminar', 'importance']);
assert.deepEqual(classifyMail(mails[3], settings), []); // flagged is user state, not importance
assert.deepEqual(createDigest([mails[0]], { ...settings, senderAllowlist: [] }).matchedIds, []); // removing allowlist takes effect

const first = createDigest(mails, settings);
assert.deepEqual(first.matchedIds, ['both', 'seminar', 'sender', 'yesterday']);
assert.deepEqual(first.counts, { sender: 3, seminar: 2, importance: 1 });
const second = createDigest(mails, settings, first.matchedIds);
assert.deepEqual(second.matchedIds, []); // delivered de-duplicates a complete run

assert.deepEqual(parseQuery('今天来自 Office 的新邮件', mails, '2026-09-12T12:00:00Z').matchedIds, ['sender', 'both']);
assert.deepEqual(parseQuery('Office 有新邮件吗', mails, '2026-09-12T12:00:00Z').matchedIds, ['sender', 'both']);
assert.deepEqual(parseQuery('昨天的邮件', mails, '2026-09-12T12:00:00Z').matchedIds, ['yesterday']);
assert.deepEqual(parseQuery('seminar subject', mails, '2026-09-12T12:00:00Z').matchedIds, ['seminar', 'both']);
assert.deepEqual(parseQuery('from unknown', mails).matchedIds, []);
assert.match(parseQuery('from unknown', mails).warning ?? '', /发件人/);

const flagged = setFlaggedById(mails, 'seminar');
assert.equal(flagged.find((mail) => mail.id === 'seminar')?.flagged, true);
assert.equal(flagged.find((mail) => mail.id === 'seminar')?.importance, false);

const memory = new Map<string, string>();
const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } };
assert.equal(safeWrite('settings', settings, storage), true);
assert.deepEqual(safeRead('settings', null, storage), settings);
assert.deepEqual(safeRead('broken', { fallback: true }, { getItem: () => '{' }), { fallback: true });

console.log('agent-tests: ok');
