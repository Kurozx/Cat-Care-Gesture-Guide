import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';
import { client } from '../lib/supabase';
import { confirmationRedirect, emailAuthError } from '../lib/email-confirmation';
import { guides } from './guides';
import { required, validateLog } from '../domain';
import type { Cat, DailyLog, Guide, Home, LogAction, Snapshot, Vaccine } from '../types';

export type Mode = 'guest' | 'demo' | 'live';
const DEMO_KEY = 'catcare.demo.v1';
const uid = () => `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
function initialDemo(): Snapshot {
  const now = Date.now();
  return {
    profile: { id: 'demo-user', username: 'catlover', full_name: 'คนรักแมว', phone: '', role: 'user' },
    homes: [{ id: 'demo-home', owner_id: 'demo-user', name: 'บ้านของเรา', location: '', home_type: 'บ้าน', is_active: true }],
    cats: [{ id: 'demo-cat', home_id: 'demo-home', name: 'มะลิ', breed: 'แมวไทย', microchip_code: '', birth_date: '2023-03-10', notes: 'ชอบนอนริมหน้าต่าง' }],
    logs: ['นวดอุ้งเท้า', 'หางตั้งขึ้น', 'เสียงคราง', 'สะบัดหาง'].map((behavior, i) => ({ id: `demo-log-${i}`, home_id: 'demo-home', cat_id: 'demo-cat', reporter_id: 'demo-user', title: behavior, behavior, occurred_at: new Date(now - i * 86400000 - 3600000).toISOString(), level: i === 3 ? 'medium' : 'low', note: i === 3 ? 'สะบัดหางเมื่อได้ยินเสียงดัง' : 'สังเกตหลังจากเล่นด้วยกัน', status: i === 3 ? 'follow_up' : 'observed' })),
    vaccines: [{ id: 'demo-vaccine', home_id: 'demo-home', cat_id: 'demo-cat', name: 'นัดปรึกษาเรื่องวัคซีน', administered_on: null, due_at: new Date(now + 7 * 86400000).toISOString(), note: 'ข้อมูลตัวอย่าง กรุณานัดหมายจริงกับคลินิก' }],
    members: [{ home_id: 'demo-home', user_id: 'demo-user', username: 'catlover', full_name: 'คนรักแมว' }],
  };
}
let demo: Snapshot | null = null;
async function demoData() {
  if (!demo) { const stored = await AsyncStorage.getItem(DEMO_KEY); demo = stored ? JSON.parse(stored) : initialDemo(); }
  return demo!;
}
async function persist() { await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(demo)); }
function check<T extends { data: unknown; error: { message: string } | null }>(result: T): T['data'] {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
function must(mode: Mode) { if (mode === 'guest') throw new Error('กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล'); }
// PostgREST limits individual responses; paginate to avoid silently losing history.
async function readAll(table: string, columns = '*', order = 'id'): Promise<any[]> {
  const rows: any[] = [];
  for (let start = 0; ; start += 500) {
    let query = client().from(table).select(columns).order(order);
    if (table === 'home_members') query = query.order('user_id');
    const page = check(await query.range(start, start + 499)) ?? [];
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}
export async function loadGuides(mode: Mode): Promise<Guide[]> {
  if (mode === 'demo') return guides;
  return check(await client().from('guides').select('*').order('title')) as Guide[];
}
export async function loadSnapshot(mode: Mode): Promise<Snapshot> {
  must(mode);
  if (mode === 'demo') return JSON.parse(JSON.stringify(await demoData())) as Snapshot;
  const db = client();
  const user = check(await db.auth.getUser()).user;
  if (!user) throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง');
  const [profileResult, homes, cats, logs, vaccines, members] = await Promise.all([
    db.from('cat_owners').select('*').eq('id', user.id).single(), readAll('homes'), readAll('cats'), readAll('daily_logs'),
    readAll('vaccinations'), readAll('home_members', 'home_id,user_id,cat_owners(username,full_name)', 'home_id'),
  ]);
  const profile = check(profileResult);
  if (profile.avatar_path) {
    const signed = await db.storage.from('profile-avatars').createSignedUrl(profile.avatar_path, 3600);
    profile.avatar_url = signed.data?.signedUrl;
  }
  return { profile, homes, cats, logs, vaccines,
    members: members.map((m: any) => ({ home_id: m.home_id, user_id: m.user_id, username: m.cat_owners?.username ?? '', full_name: m.cat_owners?.full_name ?? '' })) } as Snapshot;
}
export async function saveLog(mode: Mode, input: Omit<DailyLog, 'id' | 'reporter_id'>, id?: string) {
  must(mode); validateLog(input); required(input.title, 'หัวข้อ');
  if (mode === 'demo') {
    const data = await demoData();
    if (id) data.logs = data.logs.map(l => l.id === id ? { ...l, ...input } : l);
    else data.logs.unshift({ ...input, id: uid(), reporter_id: data.profile.id });
    await persist(); return;
  }
  const db = client();
  if (id) {
    const { home_id, cat_id, ...editable } = input;
    check(await db.from('daily_logs').update(editable).eq('id', id).select().single());
  } else {
    const user = check(await db.auth.getUser()).user!;
    check(await db.from('daily_logs').insert({ ...input, reporter_id: user.id }).select().single());
  }
}
export async function deleteLog(mode: Mode, id: string) {
  must(mode);
  if (mode === 'demo') { const d = await demoData(); d.logs = d.logs.filter(l => l.id !== id); await persist(); return; }
  check(await client().from('daily_logs').delete().eq('id', id).select().single());
}
export async function saveCat(mode: Mode, input: Omit<Cat, 'id'>, id?: string) {
  must(mode); required(input.name, 'ชื่อแมว', 80);
  if (mode === 'demo') { const d = await demoData(); if (id) d.cats = d.cats.map(c => c.id === id ? { ...c, ...input } : c); else d.cats.push({ ...input, id: uid() }); await persist(); return; }
  const { home_id, ...editable } = input;
  check(id ? await client().from('cats').update(editable).eq('id', id).select().single() : await client().from('cats').insert(input).select().single());
}
export async function deleteCat(mode: Mode, id: string) {
  must(mode);
  if (mode === 'demo') { const d = await demoData(); d.cats = d.cats.filter(c => c.id !== id); d.logs = d.logs.filter(l => l.cat_id !== id); d.vaccines = d.vaccines.filter(v => v.cat_id !== id); await persist(); return; }
  check(await client().from('cats').delete().eq('id', id).select().single());
}
export async function createHome(mode: Mode, input: Pick<Home, 'name' | 'location' | 'home_type'>) {
  must(mode); required(input.name, 'ชื่อบ้าน', 120);
  if (mode === 'demo') { const d = await demoData(); const home = { ...input, id: uid(), owner_id: d.profile.id, is_active: true }; d.homes.push(home); d.members.push({ home_id: home.id, user_id: d.profile.id, username: d.profile.username, full_name: d.profile.full_name }); await persist(); return; }
  const user = check(await client().auth.getUser()).user!;
  check(await client().from('homes').insert({ ...input, owner_id: user.id }).select().single());
}
export type ProfilePhoto = { base64: string; mimeType: string };
export async function saveProfile(mode: Mode, full_name: string, phone: string, photo?: ProfilePhoto | null) {
  must(mode); required(full_name, 'ชื่อและนามสกุล', 120);
  const bytes = photo ? decode(photo.base64) : undefined;
  if (photo && (!['image/jpeg','image/png','image/webp'].includes(photo.mimeType) || !bytes?.byteLength || bytes.byteLength > 2097152)) throw new Error('เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 2 MB');
  if (mode === 'demo') { const d = await demoData(); d.profile = { ...d.profile, full_name, phone, ...(photo !== undefined ? { avatar_url: photo ? `data:${photo.mimeType};base64,${photo.base64}` : undefined } : {}) }; await persist(); return; }
  const user = check(await client().auth.getUser()).user!;
  const db = client();
  const previous = photo !== undefined ? check(await db.from('cat_owners').select('avatar_path').eq('id',user.id).single())?.avatar_path : undefined;
  let path: string | null | undefined;
  if (photo && bytes) {
    const extension = photo.mimeType === 'image/jpeg' ? 'jpg' : photo.mimeType.split('/')[1];
    path = `${user.id}/${uid()}.${extension}`;
    check(await db.storage.from('profile-avatars').upload(path, bytes, { contentType: photo.mimeType, upsert: false }));
  } else if (photo === null) path = null;
  try { check(await db.from('cat_owners').update({ full_name, phone, ...(path !== undefined ? { avatar_path: path } : {}) }).eq('id', user.id).select().single()); }
  catch (error) { if (path) await db.storage.from('profile-avatars').remove([path]); throw error; }
  if (previous && previous !== path) await db.storage.from('profile-avatars').remove([previous]);
}
export async function saveVaccine(mode: Mode, input: Omit<Vaccine, 'id'>, id?: string) {
  must(mode); required(input.name, 'ชื่อวัคซีนหรือนัดหมาย', 120);
  if (mode === 'demo') { const d = await demoData(); if (id) d.vaccines = d.vaccines.map(v => v.id === id ? { ...v, ...input } : v); else d.vaccines.push({ ...input, id: uid() }); await persist(); return; }
  const { home_id, cat_id, ...editable } = input;
  check(id ? await client().from('vaccinations').update(editable).eq('id', id).select().single() : await client().from('vaccinations').insert(input).select().single());
}
export async function deleteVaccine(mode: Mode, id: string) {
  must(mode);
  if (mode === 'demo') { const d = await demoData(); d.vaccines = d.vaccines.filter(v => v.id !== id); await persist(); return; }
  check(await client().from('vaccinations').delete().eq('id', id).select().single());
}
export async function addMember(mode: Mode, home: string, username: string) {
  must(mode); required(username, 'ชื่อผู้ใช้');
  if (mode === 'demo') throw new Error('การเพิ่มสมาชิกใช้ได้เมื่อเชื่อมต่อ Supabase และสมาชิกลงทะเบียนแล้ว');
  check(await client().rpc('add_family_member', { target_home: home, member_username: username }));
}
export async function removeMember(mode: Mode, home: string, user: string) {
  must(mode);
  if (mode === 'demo') throw new Error('ใช้ได้เมื่อเชื่อมต่อ Supabase');
  check(await client().rpc('remove_family_member', { target_home: home, target_user: user }));
}
export async function getActions(mode: Mode, id: string): Promise<LogAction[]> {
  if (mode === 'demo') return [];
  return check(await client().from('log_actions').select('*').eq('log_id', id).order('created_at', { ascending: false })) as LogAction[];
}
export async function saveGuide(guide: Guide) { check(await client().from('guides').upsert(guide).select().single()); }
export async function resetDemo() { demo = initialDemo(); await persist(); }

export async function signIn(identifier: string, password: string) {
  const login = required(identifier, 'อีเมลหรือชื่อผู้ใช้').toLowerCase(); required(password, 'รหัสผ่าน');
  if (login.includes('@')) {
    const result = await client().auth.signInWithPassword({ email: login, password });
    if (result.error) throw new Error(emailAuthError(result.error));
    check(result); return;
  }
  const result = await client().functions.invoke('login-with-username', { body: { username: login, password } });
  if (result.error || !result.data?.access_token) throw new Error('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน หากเพิ่งสมัคร ให้กดลิงก์ยืนยันในอีเมลก่อน (ตรวจสอบโฟลเดอร์สแปมด้วย) หรือลองเข้าสู่ระบบด้วยอีเมลเพื่อดูสาเหตุเพิ่มเติม');
  check(await client().auth.setSession({ access_token: result.data.access_token, refresh_token: result.data.refresh_token }));
}
export async function signUp(input: { username: string; full_name: string; phone: string; email: string; password: string }) {
  const username = input.username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(username)) throw new Error('ชื่อผู้ใช้ใช้ a-z, 0-9 หรือ _ จำนวน 3–30 ตัว');
  required(input.full_name, 'ชื่อและนามสกุล', 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new Error('กรุณากรอกอีเมลให้ถูกต้อง');
  if (input.password.length < 8) throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  const result = await client().auth.signUp({ email: input.email.trim(), password: input.password, options: { emailRedirectTo: confirmationRedirect(), data: { username, full_name: input.full_name.trim(), phone: input.phone.trim() } } });
  if (result.error) throw new Error(emailAuthError(result.error));
  return check(result);
}

