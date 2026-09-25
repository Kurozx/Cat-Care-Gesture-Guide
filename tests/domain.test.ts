import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dateOnly, filterLogs, localInput, parseLocalDateTime, summary, validateLog } from '../src/domain';
import type { DailyLog } from '../src/types';
const now = Date.parse('2026-09-21T09:00:00Z');
const log: DailyLog = { id: 'a', home_id: 'h', cat_id: 'cat', reporter_id: 'u', title: 'หางตั้ง', behavior: 'หางตั้ง', occurred_at: new Date(now).toISOString(), level: 'low', note: 'หลังเล่น', status: 'observed' };
test('Thai search respects cat and level filters', () => {
  const logs = [log, { ...log, id: 'b', cat_id: 'other' }, { ...log, id: 'c', level: 'high' as const }];
  assert.deepEqual(filterLogs(logs, 'หลังเล่น', 'cat', 'low').map(l => l.id), ['a']);
  assert.equal(filterLogs(logs, 'ไม่พบ', '', 'all').length, 0);
});
test('summary uses only last seven days of selected cat, does not invent empty score', () => {
  assert.equal(summary([], 'cat', now).lowPercent, null);
  const result = summary([log, { ...log, id: 'b', level: 'high', status: 'follow_up' }, { ...log, id: 'c', cat_id: 'other' }, { ...log, id: 'd', occurred_at: new Date(now - 8 * 86400000).toISOString() }], 'cat', now);
  assert.equal(result.count, 2); assert.equal(result.lowPercent, 50); assert.equal(result.followUp, 1);
});
test('date parsing rejects rollovers and preserves device-local wall time', () => {
  assert.throws(() => parseLocalDateTime('2026-02-30 09:00'));
  assert.throws(() => parseLocalDateTime('2026-01-01 24:00'));
  assert.throws(() => dateOnly('21/09/2026'));
  assert.equal(dateOnly('2024-02-29'), '2024-02-29');
  assert.equal(localInput(parseLocalDateTime('2026-09-21 09:30')), '2026-09-21 09:30');
});
test('log validation rejects missing cat, behavior and future observations', () => {
  assert.doesNotThrow(() => validateLog(log, now));
  assert.throws(() => validateLog({ ...log, cat_id: '' }, now));
  assert.throws(() => validateLog({ ...log, behavior: '  ' }, now));
  assert.throws(() => validateLog({ ...log, occurred_at: new Date(now + 120000).toISOString() }, now));
  assert.throws(() => validateLog({ ...log, note: 'a'.repeat(2001) }, now));
});
