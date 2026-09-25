import { Platform } from 'react-native';
import { client } from './supabase';

export function confirmationRedirect() {
  return process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim() ||
    (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined);
}

export function emailAuthError(error: { code?: string; message: string }) {
  if (error.code === 'email_not_confirmed') return 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ ตรวจกล่องจดหมายและสแปม หรือกดส่งอีเมลยืนยันอีกครั้งด้านล่าง';
  if (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') return 'ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองอีกครั้ง';
  if (error.code === 'email_address_not_authorized') return 'ระบบส่งอีเมลยังไม่รองรับผู้รับนี้ กรุณาติดต่อผู้ดูแลเพื่อตั้งค่าบริการส่งอีเมล';
  return error.message;
}

export async function resendConfirmation(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('กรุณากรอกอีเมลที่ใช้สมัคร เพื่อรับลิงก์ยืนยัน');
  const { error } = await client().auth.resend({ type: 'signup', email: normalized, options: { emailRedirectTo: confirmationRedirect() } });
  if (error) throw new Error(emailAuthError(error));
}
