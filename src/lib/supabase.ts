import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
export const configured = Boolean(url && key && /^https?:\/\//.test(url));
export const supabase = configured ? createClient(url!, key!, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
}) : null;
export function client() {
  if (!supabase) throw new Error('ยังไม่ได้เชื่อมต่อ Supabase กรุณาตั้งค่าไฟล์ .env หรือเลือกโหมดสาธิต');
  return supabase;
}
