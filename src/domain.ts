import type { DailyLog, Level } from './types';

export function required(value: string, label: string, max = 200) {
  const clean = value.trim();
  if (!clean) throw new Error(`กรุณากรอก${label}`);
  if (clean.length > max) throw new Error(`${label}ต้องไม่เกิน ${max} ตัวอักษร`);
  return clean;
}
export function parseLocalDateTime(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error('กรอกวันเวลาเป็น YYYY-MM-DD HH:mm (ปี ค.ศ.)');
  const [, yy, mm, dd, hh, mi] = match.map(Number);
  const date = new Date(yy, mm - 1, dd, hh, mi);
  if (date.getFullYear() !== yy || date.getMonth() !== mm - 1 || date.getDate() !== dd || date.getHours() !== hh || date.getMinutes() !== mi) throw new Error('วันเวลานี้ไม่มีอยู่จริง');
  return date.toISOString();
}
export function dateOnly(value: string): string | null {
  if (!value.trim()) return null;
  parseLocalDateTime(`${value} 12:00`);
  return value;
}
export function localInput(value = new Date().toISOString()) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function validateLog(input: { cat_id: string; behavior: string; occurred_at: string; level: Level; note: string }, now = Date.now()) {
  required(input.cat_id, 'ชื่อแมว'); required(input.behavior, 'พฤติกรรม', 80);
  if (!['low', 'medium', 'high'].includes(input.level)) throw new Error('กรุณาเลือกระดับ');
  if (!Number.isFinite(Date.parse(input.occurred_at)) || Date.parse(input.occurred_at) > now + 60000) throw new Error('เวลาที่บันทึกต้องไม่อยู่ในอนาคต');
  if (input.note.length > 2000) throw new Error('หมายเหตุต้องไม่เกิน 2,000 ตัวอักษร');
}
export function summary(logs: DailyLog[], catId: string, now = Date.now()) {
  const all = logs.filter(l => l.cat_id === catId).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const week = all.filter(l => Date.parse(l.occurred_at) >= now - 7 * 86400000 && Date.parse(l.occurred_at) <= now);
  return { count: week.length, followUp: all.filter(l => l.status === 'follow_up').length, latest: all[0] ?? null, lowPercent: week.length ? Math.round(100 * week.filter(l => l.level === 'low').length / week.length) : null };
}
export function filterLogs(logs: DailyLog[], query: string, catId: string, level: Level | 'all') {
  const q = query.trim().toLocaleLowerCase();
  return logs.filter(l => (!catId || l.cat_id === catId) && (level === 'all' || l.level === level) && `${l.title} ${l.behavior} ${l.note}`.toLocaleLowerCase().includes(q)).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}
export const formatDate = (value: string) => new Date(value).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
