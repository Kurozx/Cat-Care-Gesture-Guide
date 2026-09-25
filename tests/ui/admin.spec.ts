import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('admin screens create, edit, delete guides and confirm role changes (mock API)', async ({ page }) => {
  const env = readFileSync('.env', 'utf8');
  const url = env.match(/^EXPO_PUBLIC_SUPABASE_URL=(.+)$/m)![1].trim();
  const ref = new URL(url).hostname.split('.')[0];
  const id = '10000000-0000-4000-8000-000000000001';
  const user = { id, aud: 'authenticated', role: 'authenticated', email: 'admin@example.test', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const profile = { id, username: 'test_admin', full_name: 'Test Admin', phone: '', role: 'admin', email: 'admin@example.test', email_confirmed_at: new Date().toISOString() };
  const users = [profile, { ...profile, id: '10000000-0000-4000-8000-000000000002', username: 'test_user', full_name: 'Test User', role: 'user' }];
  let guides: any[] = [];
  let roleUpdates = 0;
  const token = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, role: 'authenticated', exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.test`;
  await page.addInitScript(({ ref, user, token }) => localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({ access_token: token, refresh_token: 'test-only', expires_at: Math.floor(Date.now()/1000)+3600, expires_in: 3600, token_type: 'bearer', user })), { ref, user, token });
  await page.route(`${url}/**`, async route => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().postDataJSON();
    let result: any = [];
    if(path === '/auth/v1/user') result = user;
    else if(path === '/rest/v1/cat_owners') result = profile;
    else if(path === '/rest/v1/guides') result = guides;
    else if(path.endsWith('/admin_records')) result = body.target_table === 'cat_owners' ? users : body.target_table === 'guides' ? guides : [];
    else if(path.endsWith('/admin_save_record')) {
      const record = { ...body.payload, id: body.record_id || 'test-guide' };
      guides = [...guides.filter(g => g.id !== record.id), record]; result = record;
    } else if(path.endsWith('/admin_delete_record')) { guides = guides.filter(g => g.id !== body.record_id); result = null; }
    else if(path.endsWith('/admin_update_user')) { roleUpdates++; users.find(u => u.id === body.target_user)!.role = body.new_role; result = null; }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
  });
  await page.goto('/');
  await expect(page.getByText('แผงควบคุมแอดมิน', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'เพิ่มคู่มือ', exact: true }).click();
  await page.getByLabel('ชื่อคู่มือ', { exact: true }).fill('คู่มือทดสอบแอดมิน');
  await page.getByLabel('รายละเอียด', { exact: true }).fill('รายละเอียดทดสอบ');
  await page.getByLabel('แหล่งอ้างอิง HTTPS', { exact: true }).fill('https://example.test/guide');
  await page.getByRole('button', { name: 'บันทึกข้อมูล', exact: true }).click();
  await page.getByRole('button', { name: 'แก้ไข คู่มือทดสอบแอดมิน', exact: true }).click();
  await page.getByLabel('ชื่อคู่มือ', { exact: true }).fill('แก้ไขคู่มือแล้ว');
  await page.getByRole('button', { name: 'บันทึกข้อมูล', exact: true }).click();
  await page.getByRole('button', { name: 'ลบ แก้ไขคู่มือแล้ว', exact: true }).click();
  await expect(page.getByRole('button', { name: 'ยืนยันลบถาวร' })).toBeDisabled();
  await page.getByLabel('ยืนยันการลบ', { exact: true }).fill('DELETE');
  await page.getByRole('button', { name: 'ยืนยันลบถาวร' }).click();
  await expect(page.getByText('ไม่พบข้อมูล', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'ผู้ใช้', exact: true }).click();
  await page.getByRole('button', { name: 'แก้ไข Test User', exact: true }).click();
  await page.getByRole('button', { name: 'Admin · ผู้ดูแลระบบ', exact: true }).click();
  await page.getByRole('button', { name: 'บันทึกข้อมูล', exact: true }).click();
  expect(roleUpdates).toBe(0);
  await page.getByRole('button', { name: 'ยืนยันเปลี่ยนบทบาทและบันทึก', exact: true }).click();
  await expect(page.getByRole('button', { name: 'แก้ไข Test User', exact: true })).toBeVisible();
  expect(roleUpdates).toBe(1);
  await page.screenshot({ path: '../artifacts/admin-users.png' });
});
