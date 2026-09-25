import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('ไม่พบค่า Supabase ใน mobile/.env');

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const guides = await supabase.from('guides').select('id', { count: 'exact', head: true });
if (guides.error || guides.count !== 8) throw new Error(guides.error?.message || `จำนวนคู่มือไม่ถูกต้อง: ${guides.count}`);

const privateTable = await supabase.from('cats').select('id', { count: 'exact', head: true });
if (privateTable.status !== 401) throw new Error('RLS/สิทธิ์ตาราง cats ไม่ได้ปฏิเสธผู้ใช้ที่ยังไม่เข้าสู่ระบบ');

const fn = await fetch(`${url}/functions/v1/login-with-username`, {
  method: 'POST',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'invalid_check_user', password: 'invalid-check-password' }),
});
if (fn.status !== 401) throw new Error(`Edge Function ตอบสถานะผิดปกติ: ${fn.status}`);

console.log('Supabase connected: 8 public guides, private cats protected, username login function reachable.');
