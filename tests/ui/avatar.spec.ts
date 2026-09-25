import { test, expect } from '@playwright/test';
import path from 'node:path';

test('profile photo is saved, restored after reload and removable', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'ทดลองใช้ด้วยข้อมูลสาธิต',exact:true}).click();
  await page.getByRole('tab',{name:'บัญชี',exact:true}).click();
  await expect(page.getByText('catlover',{exact:true})).toBeVisible();
  await expect(page.getByText('เพื่อนคนโปรดของเจ้าเหมียว',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'แก้ไขรูปโปรไฟล์',exact:true}).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button',{name:'เลือกรูปโปรไฟล์',exact:true}).click();
  await (await chooser).setFiles(path.resolve('assets/owner-avatar.png'));
  await expect(page.getByRole('button',{name:'ใช้รูปเริ่มต้น',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'บันทึกโปรไฟล์',exact:true}).click();
  await expect(page.getByRole('img',{name:'รูปโปรไฟล์',exact:true})).toHaveAttribute('src',/^data:image/);
  await page.reload();
  await page.getByRole('button',{name:'ทดลองใช้ด้วยข้อมูลสาธิต',exact:true}).click();
  await page.getByRole('tab',{name:'บัญชี',exact:true}).click();
  await expect(page.getByRole('img',{name:'รูปโปรไฟล์',exact:true})).toHaveAttribute('src',/^data:image/);
  await page.getByRole('button',{name:'แก้ไขรูปโปรไฟล์',exact:true}).click();
  await page.getByRole('button',{name:'ใช้รูปเริ่มต้น',exact:true}).click();
  await page.getByRole('button',{name:'บันทึกโปรไฟล์',exact:true}).click();
  await expect(page.getByRole('img',{name:'รูปโปรไฟล์',exact:true})).not.toHaveAttribute('src',/^data:image/);
});
