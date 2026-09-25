import { client } from '../lib/supabase';
export type AdminTable = 'cat_owners' | 'guides' | 'homes' | 'cats' | 'daily_logs' | 'vaccinations' | 'admin_actions';
export type AdminRecord = Record<string, any> & { id: string };
async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await client().rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}
export async function adminRecords(table: AdminTable, page = 0): Promise<AdminRecord[]> {
  const rows: AdminRecord[] = await rpc('admin_records', { target_table: table, page_number: page });
  if (table !== 'cat_owners') return rows;
  const withPhotos = rows.filter(row => typeof row.avatar_path === 'string' && row.avatar_path);
  if (!withPhotos.length) return rows;
  const { data, error } = await client().storage.from('profile-avatars').createSignedUrls(withPhotos.map(row => row.avatar_path), 3600);
  if (error) return rows;
  withPhotos.forEach((row, index) => { row.avatar_url = data?.[index]?.signedUrl; });
  return rows;
}
export async function adminChoices(table: 'homes' | 'cats' | 'cat_owners') {
  const result: AdminRecord[] = [];
  for (let page = 0; ; page++) {
    const rows = await adminRecords(table, page); result.push(...rows);
    if (rows.length < 100) return result;
  }
}
export async function adminSave(table: AdminTable, id: string | null, payload: Record<string, unknown>) {
  return rpc('admin_save_record', { target_table: table, record_id: id, payload });
}
export async function adminUpdateUser(user: AdminRecord) {
  return rpc('admin_update_user', { target_user: user.id, new_name: user.full_name, new_phone: user.phone, new_role: user.role });
}
export async function adminDelete(table: AdminTable, id: string, confirmation: string) {
  return rpc('admin_delete_record', { target_table: table, record_id: id, confirmation });
}
