import { test, expect } from '@playwright/test';

test('confirmation resend validates email, calls Supabase and prevents repeat sends', async ({ page }) => {
  let requests = 0;
  await page.route('**/auth/v1/resend**', async route => {
    requests++;
    expect(route.request().postDataJSON()).toMatchObject({ type: 'signup', email: 'confirmation@example.com' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'เปิดบัญชีของฉัน', exact: true }).click();
  await page.getByRole('button', { name: 'ยังไม่ได้รับอีเมลยืนยัน?', exact: true }).click();
  await page.getByRole('button', { name: 'ส่งอีเมลยืนยันอีกครั้ง', exact: true }).click();
  await expect(page.getByText('กรุณากรอกอีเมลที่ใช้สมัคร เพื่อรับลิงก์ยืนยัน', { exact: true })).toBeVisible();
  expect(requests).toBe(0);
  await page.getByLabel('อีเมลสำหรับยืนยัน', { exact: true }).fill('confirmation@example.com');
  await page.getByRole('button', { name: 'ส่งอีเมลยืนยันอีกครั้ง', exact: true }).click();
  await expect(page.getByText(/หากอีเมลนี้มีบัญชีที่รอยืนยัน/)).toBeVisible();
  await expect(page.getByRole('button', { name: /ส่งใหม่ได้ใน/ })).toBeDisabled();
  expect(requests).toBe(1);
});
