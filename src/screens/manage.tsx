import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../state';
import { Button, Card, Chip, Empty, Field, Heading, Icon, s } from '../ui';
import { dateOnly, formatDate, localInput, parseLocalDateTime } from '../domain';
import * as repo from '../data/repository';
import type { ScreenProps } from '../navigation';
import type { Cat, Vaccine } from '../types';
import { CatSelector } from './logs';
import { clearReminders, syncReminders } from '../lib/notifications';
import { BirthDatePicker, BreedPicker } from './cat-fields';

export function useTask() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function run(action: () => Promise<void>) { setBusy(true); setError(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'ดำเนินการไม่สำเร็จ'); } finally { setBusy(false); } }
  return { busy, error, run };
}
export function Cats({ navigate }: ScreenProps) {
  const app = useApp(); const task = useTask(); const [homeName, setHomeName] = useState(''); const [location, setLocation] = useState('');
  return <View style={{ gap: 20 }}><Heading title="แมวและบ้านของเรา" subtitle="แต่ละบ้านมีเพื่อนตัวน้อยได้หลายตัว" />
    {app.data?.homes.map(h => <Card key={h.id}><View style={s.row}><Icon name="home-heart" /><View style={{ flex: 1 }}><Text style={s.h3}>{h.name}</Text><Text style={s.muted}>{h.owner_id === app.data!.profile.id ? 'เจ้าของบ้าน' : 'สมาชิกครอบครัว'}{h.location ? ` · ${h.location}` : ''}</Text></View></View>
      {app.data!.cats.filter(c => c.home_id === h.id).map(c => <View key={c.id} style={{ gap: 8 }}><Text style={s.h3}>🐾 {c.name}</Text><Text style={s.muted}>{c.breed || 'ยังไม่ระบุสายพันธุ์'}{c.birth_date ? ` · เกิด ${c.birth_date}` : ''}</Text>{!!c.notes && <Text style={s.text}>{c.notes}</Text>}{h.owner_id === app.data!.profile.id && <Button title={`แก้ไข ${c.name}`} secondary onPress={() => navigate({ name: 'cat', cat: c })} />}</View>)}
    </Card>)}
    {app.data?.homes.some(h => h.owner_id === app.data!.profile.id) && <Button title="เพิ่มโปรไฟล์แมว" icon="plus" onPress={() => navigate({ name: 'cat' })} />}
    <Card><Text style={s.h3}>สร้างบ้านใหม่</Text><Field label="ชื่อบ้าน" value={homeName} onChangeText={setHomeName} placeholder="บ้านของเรา" /><Field label="ที่อยู่ / สถานที่ (ไม่บังคับ)" value={location} onChangeText={setLocation} />{!!task.error && <Text style={s.error}>{task.error}</Text>}<Button title="สร้างบ้าน" loading={task.busy} onPress={() => void task.run(async () => { await repo.createHome(app.mode, { name: homeName.trim(), location: location.trim(), home_type: 'บ้าน' }); await app.refresh(); setHomeName(''); setLocation(''); app.setNotice('สร้างบ้านแล้ว เพิ่มแมวได้เลย'); })} /></Card>
  </View>;
}
export function CatForm({ cat, back }: ScreenProps & { cat?: Cat }) {
  const app = useApp(); const task = useTask(); const homes = app.data?.homes.filter(h => h.owner_id === app.data?.profile.id) ?? [];
  const [home, setHome] = useState(cat?.home_id ?? homes[0]?.id ?? ''); const [name, setName] = useState(cat?.name ?? ''); const [breed, setBreed] = useState(cat?.breed ?? ''); const [birth, setBirth] = useState(cat?.birth_date ?? ''); const [notes, setNotes] = useState(cat?.notes ?? ''); const [confirm, setConfirm] = useState(false);
  return <View style={{ gap: 20 }}><Heading title={cat ? `โปรไฟล์ ${cat.name}` : 'เพิ่มเพื่อนตัวน้อย'} /><Text style={s.label}>บ้านของแมว</Text><View style={s.wrap}>{homes.filter(h => !cat || h.id === cat.home_id).map(h => <Chip key={h.id} text={h.name} active={home === h.id} onPress={() => setHome(h.id)} />)}</View><Field label="ชื่อแมว" value={name} onChangeText={setName} maxLength={80} /><BreedPicker value={breed} onChange={setBreed} /><BirthDatePicker value={birth} onChange={setBirth} /><Field label="ข้อมูลเพิ่มเติม" value={notes} onChangeText={setNotes} multiline />{!!task.error && <Text style={s.error}>{task.error}</Text>}<Button title="บันทึกโปรไฟล์แมว" loading={task.busy} onPress={() => void task.run(async () => { if (!home) throw new Error('กรุณาสร้างบ้านก่อน'); const birthDate = dateOnly(birth); if (birthDate && birthDate > localInput().slice(0, 10)) throw new Error('วันเกิดต้องไม่อยู่ในอนาคต'); await repo.saveCat(app.mode, { home_id: home, name: name.trim(), breed: breed.trim(), birth_date: birthDate, microchip_code: cat?.microchip_code ?? '', notes: notes.trim() }, cat?.id); await app.refresh(); app.setNotice('บันทึกโปรไฟล์แมวแล้ว'); back(); })} />
    {cat && (confirm ? <Card><Text style={s.error}>การลบแมวจะลบบันทึกและวัคซีนทั้งหมดของแมวตัวนี้ด้วย</Text><Button title="ยืนยันลบแมวและข้อมูลทั้งหมด" danger loading={task.busy} onPress={() => void task.run(async () => { await repo.deleteCat(app.mode, cat.id); await clearReminders(); await app.refresh(); app.setNotice('ลบโปรไฟล์แล้ว โปรดเปิดแจ้งเตือนใหม่สำหรับนัดหมายที่เหลือ'); back(); })} /><Button title="ยกเลิก" secondary onPress={() => setConfirm(false)} /></Card> : <Button title="ลบโปรไฟล์แมว" secondary onPress={() => setConfirm(true)} />)}
  </View>;
}
export function Vaccines({ navigate }: ScreenProps) {
  const app = useApp(); const task = useTask(); const [message, setMessage] = useState('');
  const items = app.data?.vaccines.filter(v => v.cat_id === app.catId) ?? [];
  return <View style={{ gap: 20 }}><Heading title="วัคซีนและนัดหมาย" subtitle="จดวันที่ได้รับวัคซีนและนัดหมายจากสัตวแพทย์" /><CatSelector />
    {items.map(v => <Card key={v.id}><View style={s.row}><Icon name="calendar-heart" /><Text style={[s.h3, { flex: 1 }]}>{v.name}</Text></View><Text style={s.muted}>วันที่ได้รับ: {v.administered_on || 'ยังไม่ระบุ'}</Text><Text style={s.text}>นัดครั้งถัดไป: {v.due_at ? formatDate(v.due_at) : 'ยังไม่ระบุ'}</Text>{!!v.note && <Text style={s.muted}>{v.note}</Text>}<Button title={`แก้ไข ${v.name}`} secondary onPress={() => navigate({ name: 'vaccine', vaccine: v })} /></Card>)}
    {!items.length && <Empty icon="calendar-outline" title="ยังไม่มีข้อมูลวัคซีน" detail="บันทึกตามใบนัดหรือสมุดวัคซีนของแมว" />}<Button title="เพิ่มวัคซีน / นัดหมาย" icon="plus" onPress={() => navigate({ name: 'vaccine' })} />
    <Card><Text style={s.h3}>เตือนนัดหมายบนเครื่องนี้</Text><Text style={s.muted}>ตั้งเวลาจากนัดหมายในทุกบ้านที่คุณดูแล สูงสุด 50 รายการถัดไป เปิดใหม่หลังแก้ไขนัดหมายหรือเมื่อสมาชิกคนอื่นอัปเดตข้อมูล</Text>{!!task.error && <Text style={s.error}>{task.error}</Text>}{!!message && <Text style={s.text}>{message}</Text>}<Button title="เปิด / อัปเดตการแจ้งเตือน" secondary loading={task.busy} onPress={() => void task.run(async () => { await syncReminders(app.data?.vaccines ?? []); setMessage('ตั้งการแจ้งเตือนสำหรับนัดหมายในอนาคตบนเครื่องนี้แล้ว'); })} /><Button title="ปิดการแจ้งเตือนบนเครื่องนี้" secondary onPress={() => void task.run(async () => { await clearReminders(); setMessage('ปิดการแจ้งเตือนแล้ว'); })} /></Card>
  </View>;
}
export function VaccineForm({ vaccine, back, navigate }: ScreenProps & { vaccine?: Vaccine }) {
  const app = useApp(); const task = useTask(); const [catId, setCatId] = useState(vaccine?.cat_id ?? app.catId); const [name, setName] = useState(vaccine?.name ?? ''); const [given, setGiven] = useState(vaccine?.administered_on ?? ''); const [due, setDue] = useState(vaccine?.due_at ? localInput(vaccine.due_at) : ''); const [note, setNote] = useState(vaccine?.note ?? ''); const [confirm, setConfirm] = useState(false);
  if (!app.data?.cats.length) return <View style={{ gap: 20 }}><Empty title="ยังไม่มีโปรไฟล์แมว" detail="เพิ่มแมวก่อนบันทึกวัคซีน" /><Button title="จัดการแมว" onPress={() => navigate({ name: 'cats' })} /></View>;
  return <View style={{ gap: 20 }}><Heading title={vaccine ? 'แก้ไขวัคซีน / นัดหมาย' : 'เพิ่มวัคซีน / นัดหมาย'} /><View style={s.wrap}>{app.data.cats.filter(c => !vaccine || c.id === vaccine.cat_id).map(c => <Chip key={c.id} text={c.name} active={catId === c.id} onPress={() => setCatId(c.id)} />)}</View><Field label="ชื่อวัคซีนหรือนัดหมาย" value={name} onChangeText={setName} /><Field label="วันที่ได้รับ (YYYY-MM-DD ไม่บังคับ)" value={given} onChangeText={setGiven} /><Field label="วันเวลานัดถัดไป (YYYY-MM-DD HH:mm ไม่บังคับ)" value={due} onChangeText={setDue} /><Field label="หมายเหตุ / ชื่อคลินิก" value={note} onChangeText={setNote} multiline />{!!task.error && <Text style={s.error}>{task.error}</Text>}<Button title="บันทึกวัคซีน / นัดหมาย" loading={task.busy} onPress={() => void task.run(async () => { const cat = app.data!.cats.find(c => c.id === catId); if (!cat) throw new Error('กรุณาเลือกแมว'); const date = dateOnly(given); if (date && date > localInput().slice(0, 10)) throw new Error('วันที่ได้รับวัคซีนต้องไม่อยู่ในอนาคต'); await repo.saveVaccine(app.mode, { home_id: cat.home_id, cat_id: cat.id, name: name.trim(), administered_on: date, due_at: due.trim() ? parseLocalDateTime(due) : null, note: note.trim() }, vaccine?.id); await clearReminders(); await app.refresh(); app.setNotice('บันทึกแล้ว กดเปิด / อัปเดตการแจ้งเตือนเพื่อตั้งเตือนใหม่'); back(); })} />
    {vaccine && (confirm ? <Card><Text style={s.text}>ลบรายการนี้หรือไม่?</Text><Button title="ยืนยันลบนัดหมาย" danger loading={task.busy} onPress={() => void task.run(async () => { await repo.deleteVaccine(app.mode, vaccine.id); await clearReminders(); await app.refresh(); app.setNotice('ลบนัดแล้ว โปรดอัปเดตการแจ้งเตือนสำหรับนัดที่เหลือ'); back(); })} /><Button title="ยกเลิก" secondary onPress={() => setConfirm(false)} /></Card> : <Button title="ลบรายการนี้" secondary onPress={() => setConfirm(true)} />)}
  </View>;
}
