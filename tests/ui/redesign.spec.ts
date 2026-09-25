import {test,expect} from '@playwright/test';

test('redesigned discovery, care and profile remain usable on narrow screens', async ({page})=>{
  await page.setViewportSize({width:360,height:800});
  await page.goto('/');
  await expect(page.getByText('อยากรู้เรื่องไหนวันนี้?',{exact:true})).toBeVisible();
  await page.screenshot({path:'../artifacts/redesign-home.png'});
  await page.getByRole('button',{name:'การดูแล',exact:true}).click();
  await expect(page.getByText('ดูแลเขาในทุกวัน',{exact:true})).toBeVisible();
  await page.getByLabel('ค้นหาคู่มือ',{exact:true}).fill('อาหาร');
  await expect(page.getByRole('button',{name:'อาหารและน้ำสะอาด',exact:true})).toBeVisible();
  await page.screenshot({path:'../artifacts/redesign-care.png'});
  await page.getByRole('button',{name:'หน้าแรก',exact:true}).click();
  await page.getByRole('button',{name:'ทดลองใช้ด้วยข้อมูลสาธิต',exact:true}).click();
  await page.getByRole('tab',{name:'บัญชี',exact:true}).click();
  await expect(page.getByText('โปรไฟล์และการตั้งค่า',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'แก้ไขโปรไฟล์',exact:true})).toBeVisible();
  await page.screenshot({path:'../artifacts/redesign-profile.png'});
  await page.setViewportSize({width:320,height:720});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
