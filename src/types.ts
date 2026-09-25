export type Category = 'ทั้งหมด' | 'หาง' | 'ใบหน้า' | 'ท่าทาง' | 'การดูแล';
export type Level = 'low' | 'medium' | 'high';
export interface Guide { id: string; title: string; category: Exclude<Category, 'ทั้งหมด'>; summary: string; detail: string; advice: string; icon: string; source_url: string; published: boolean }
export interface Profile { id: string; username: string; full_name: string; phone: string; role: 'user' | 'admin'; avatar_path?: string | null; avatar_url?: string }
export interface Home { id: string; owner_id: string; name: string; location: string; home_type: string; is_active: boolean }
export interface Member { home_id: string; user_id: string; username: string; full_name: string }
export interface Cat { id: string; home_id: string; name: string; breed: string; microchip_code: string; birth_date: string | null; notes: string }
export interface DailyLog { id: string; home_id: string; cat_id: string; reporter_id: string; title: string; behavior: string; occurred_at: string; level: Level; note: string; status: 'observed' | 'follow_up' | 'resolved' }
export interface Vaccine { id: string; home_id: string; cat_id: string; name: string; administered_on: string | null; due_at: string | null; note: string }
export interface LogAction { id: string; log_id: string; observer_id: string; behavior_note: string; created_at: string }
export interface Snapshot { profile: Profile; homes: Home[]; cats: Cat[]; logs: DailyLog[]; vaccines: Vaccine[]; members: Member[] }
export const LEVELS: Record<Level, string> = { low: 'ต่ำ', medium: 'ปานกลาง', high: 'สูง' };
export const STATUSES = { observed: 'บันทึกแล้ว', follow_up: 'ติดตามอาการ', resolved: 'ติดตามแล้ว' };

