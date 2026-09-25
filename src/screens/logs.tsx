import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useApp } from '../state';
import { Button, Card, Chip, Empty, Field, Heading, Icon, Ring, colors, s } from '../ui';
import { filterLogs, formatDate, localInput, parseLocalDateTime, summary } from '../domain';
import { LEVELS, STATUSES, type DailyLog, type Level, type LogAction } from '../types';
import { deleteLog, getActions, saveLog } from '../data/repository';
import type { ScreenProps } from '../navigation';

export function CatSelector() {
  const app = useApp();
  return <View style={s.wrap}>{app.data?.cats.map(c => <Chip key={c.id} text={`🐾 ${c.name}`} active={app.catId === c.id} onPress={() => app.setCatId(c.id)} />)}</View>;
}
export function Status({ navigate }: ScreenProps) {
  const app = useApp(); const cat = app.data?.cats.find(c => c.id === app.catId);
  if (!app.data) return null;
  if (!cat) return <View style={{ gap: 26 }}><Heading title="บ้านของเจ้าเหมียว" subtitle="พื้นที่เล็ก ๆ สำหรับเรื่องราวของคุณกับเขา" /><View style={{backgroundColor:colors.pale,borderRadius:28,padding:22,gap:16}}><Empty title="ยังไม่มีโปรไฟล์แมว" detail="สร้างบ้านและเพิ่มแมวเพื่อบันทึกพฤติกรรมและติดตามการดูแล" /><Button title="จัดการแมวและบ้าน" icon="plus-circle-outline" onPress={() => navigate({ name: 'cats' })} /></View><Button title="อ่านเรื่องดูแลระหว่างรอ" secondary icon="book-open-outline" onPress={()=>navigate({name:'care'})}/></View>;
  const stats = summary(app.data.logs, cat.id);
  const due = app.data.vaccines.filter(v => v.cat_id === cat.id && v.due_at && Date.parse(v.due_at) >= Date.now()).sort((a, b) => a.due_at!.localeCompare(b.due_at!))[0];
  return <View style={{ gap: 26 }}><View style={{gap:7}}><Text style={{color:colors.orange,fontSize:11,fontWeight:'800',letterSpacing:1.6}}>OUR LITTLE EVERYDAY</Text><Heading title={`สวัสดี, ${app.data.profile.full_name.split(' ')[0]}`} subtitle="อีกหนึ่งวันที่ได้ดูแลกัน ♡" /></View><CatSelector />
    <Card><View style={[s.row, { justifyContent: 'space-between' }]}><View><Text style={s.h3}>วันนี้ของ{cat.name}</Text><Text style={s.muted}>{cat.breed || 'เพื่อนตัวน้อยของคุณ'}</Text></View><Text style={s.tag}>7 วันที่ผ่านมา</Text></View><Ring percent={stats.lowPercent} /><Text style={[s.muted, { textAlign: 'center' }]}>{stats.count ? `จากทั้งหมด ${stats.count} บันทึกใน 7 วัน` : 'เพิ่มบันทึกเพื่อเริ่มดูสถิติ'}{ '\n' }สัดส่วนระดับที่คุณเลือก ไม่ใช่คะแนนสุขภาพ</Text></Card>
    <View style={{ flexDirection: 'row', gap: 12 }}><View style={{ flex: 1 }}><Card><Icon name="heart-pulse" /><Text style={s.muted}>รอติดตาม</Text><Text style={s.h3}>{stats.followUp} บันทึก</Text></Card></View><View style={{ flex: 1 }}><Card><Icon name="calendar-outline" /><Text style={s.muted}>นัดหมายถัดไป</Text><Text style={s.h3}>{due ? new Date(due.due_at!).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : 'ยังไม่มีนัด'}</Text></Card></View></View>
    <Button title="บันทึกวันนี้ของเจ้าเหมียว" icon="plus" onPress={() => navigate({ name: 'log' })} />
    <View style={[s.row, { justifyContent: 'space-between' }]}><Text style={s.h3}>บันทึกล่าสุด</Text><Pressable accessibilityRole="button" onPress={() => navigate({ name: 'history' })}><Text style={{ color: colors.orange }}>ดูทั้งหมด →</Text></Pressable></View>
    {stats.latest ? <LogCard log={stats.latest} onPress={() => navigate({ name: 'log', log: stats.latest! })} /> : <Empty title="เริ่มบันทึกวันแรกกัน" detail="จดสิ่งเล็ก ๆ ที่สังเกตเห็นเพื่อกลับมาดูได้เสมอ" />}
    <Button title="วัคซีนและนัดหมาย" secondary icon="calendar-heart" onPress={() => navigate({ name: 'vaccines' })} />
  </View>;
}
function LogCard({ log, onPress }: { log: DailyLog; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={log.title} onPress={onPress}><Card><View style={s.row}><Icon name="notebook-heart-outline" /><View style={{ flex: 1 }}><Text style={s.h3}>{log.title}</Text><Text style={s.muted}>{formatDate(log.occurred_at)}</Text></View><Icon name="chevron-right" /></View><Text style={s.muted} numberOfLines={2}>{log.note || log.behavior}</Text><View style={s.wrap}><Text style={s.tag}>ระดับ{LEVELS[log.level]}</Text><Text style={[s.tag, log.status === 'follow_up' && { color: colors.red }]}>{STATUSES[log.status]}</Text></View></Card></Pressable>; }
export function History({ navigate }: ScreenProps) {
  const app = useApp(); const [query, setQuery] = useState(''); const [level, setLevel] = useState<Level | 'all'>('all');
  const items = filterLogs(app.data?.logs ?? [], query, app.catId, level);
  return <View style={{ gap: 20 }}><Heading title="ประวัติของเรา" subtitle="เรื่องราวเล็ก ๆ ที่ช่วยให้รู้จักเขามากขึ้น" /><CatSelector /><Field label="ค้นหาบันทึก" value={query} onChangeText={setQuery} placeholder="ค้นหาพฤติกรรมหรือหมายเหตุ" /><View style={s.wrap}><Chip text="ทุกระดับ" active={level === 'all'} onPress={() => setLevel('all')} />{(Object.keys(LEVELS) as Level[]).map(l => <Chip key={l} text={LEVELS[l]} active={level === l} onPress={() => setLevel(l)} />)}</View><Text style={s.muted}>{items.length} บันทึก</Text>{items.map(l => <LogCard key={l.id} log={l} onPress={() => navigate({ name: 'log', log: l })} />)}{!items.length && <Empty icon="notebook-outline" title="ยังไม่พบบันทึก" detail="ลองเปลี่ยนคำค้น หรือเพิ่มบันทึกใหม่ของวันนี้" />}<Button title="เพิ่มบันทึก" icon="plus" onPress={() => navigate({ name: 'log' })} /></View>;
}
export function LogForm({ log, navigate, back }: ScreenProps & { log?: DailyLog }) {
  const app = useApp(); const [catId, setCatId] = useState(log?.cat_id ?? app.catId);
  const [behavior, setBehavior] = useState(log?.behavior ?? ''); const [date, setDate] = useState(localInput(log?.occurred_at));
  const [level, setLevel] = useState<Level>(log?.level ?? 'low'); const [note, setNote] = useState(log?.note ?? '');
  const [status, setStatus] = useState<DailyLog['status']>(log?.status ?? 'observed');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false); const [actions, setActions] = useState<LogAction[]>([]);
  useEffect(() => { if (log) void getActions(app.mode, log.id).then(setActions).catch(() => {}); }, [log?.id]);
  async function submit(remove = false) {
    setBusy(true); setError('');
    try {
      if (remove && log) await deleteLog(app.mode, log.id);
      else {
        const cat = app.data?.cats.find(c => c.id === catId); if (!cat) throw new Error('กรุณาเลือกแมว');
        await saveLog(app.mode, { home_id: cat.home_id, cat_id: cat.id, title: behavior.trim(), behavior: behavior.trim(), occurred_at: parseLocalDateTime(date), level, note: note.trim(), status }, log?.id);
      }
      await app.refresh();
      if (log) back(); else navigate({ name: 'history' });
      app.setNotice(remove ? 'ลบบันทึกแล้ว' : 'บันทึกเรียบร้อยแล้ว');
    } catch (e) { setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'); } finally { setBusy(false); }
  }
  if (!app.data?.cats.length) return <View style={{ gap: 20 }}><Empty title="เพิ่มแมวก่อนบันทึก" detail="บันทึกแต่ละรายการต้องผูกกับโปรไฟล์แมว" /><Button title="เพิ่มโปรไฟล์แมว" onPress={() => navigate({ name: 'cats' })} /></View>;
  const canDelete = log && (log.reporter_id === app.data.profile.id || app.data.homes.some(h => h.id === log.home_id && h.owner_id === app.data!.profile.id));
  return <View style={{ gap: 20 }}><Heading title={log ? 'รายละเอียดบันทึก' : 'บันทึกวันนี้ของเขา'} subtitle="จดสิ่งที่สังเกตเห็นไว้ แล้วค่อย ๆ เรียนรู้ไปด้วยกัน" /><Text style={s.label}>แมวที่ต้องการบันทึก</Text><View style={s.wrap}>{app.data.cats.filter(c => !log || c.id === log.cat_id).map(c => <Chip key={c.id} text={c.name} active={catId === c.id} onPress={() => setCatId(c.id)} />)}</View>
    <Text style={s.label}>พฤติกรรมที่สังเกต</Text><View style={s.wrap}>{['หางตั้งขึ้น', 'นวดอุ้งเท้า', 'เสียงคราง', 'สะบัดหาง', 'หูลู่', 'กินอาหารน้อย'].map(b => <Chip key={b} text={b} active={behavior === b} onPress={() => setBehavior(b)} />)}</View><Field label="พฤติกรรม / หัวข้อบันทึก" value={behavior} onChangeText={setBehavior} maxLength={80} placeholder="เลือกด้านบน หรือระบุพฤติกรรมอื่น" />
    <Field label="วันที่และเวลา (ปี ค.ศ. ตามเวลาเครื่อง)" value={date} onChangeText={setDate} placeholder="2026-09-21 09:30" />
    <Text style={s.label}>ระดับความรุนแรงหรือความถี่ที่สังเกต</Text><View style={s.wrap}>{(Object.keys(LEVELS) as Level[]).map(l => <Chip key={l} text={LEVELS[l]} active={level === l} onPress={() => setLevel(l)} />)}</View>
    <Text style={s.label}>สถานะการติดตาม</Text><View style={s.wrap}>{(Object.keys(STATUSES) as DailyLog['status'][]).map(st => <Chip key={st} text={STATUSES[st]} active={status === st} onPress={() => setStatus(st)} />)}</View>
    <Field label="หมายเหตุเพิ่มเติม" value={note} onChangeText={setNote} multiline maxLength={2000} placeholder="เกิดขึ้นตอนไหน มีอะไรเปลี่ยนไปบ้าง…" />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Button title={log ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'} icon="check" loading={busy} onPress={() => void submit()} />
    {canDelete && (confirm ? <Card><Text style={s.text}>ลบบันทึกนี้ถาวรหรือไม่?</Text><Button title="ยืนยันลบบันทึก" danger loading={busy} onPress={() => void submit(true)} /><Button title="เก็บบันทึกไว้" secondary onPress={() => setConfirm(false)} /></Card> : <Button title="ลบบันทึกนี้" secondary onPress={() => setConfirm(true)} />)}
    {!!actions.length && <Card><Text style={s.h3}>ประวัติการเปลี่ยนแปลง</Text>{actions.map(a => <View key={a.id}><Text style={s.text}>{a.behavior_note}</Text><Text style={s.muted}>{formatDate(a.created_at)}</Text></View>)}</Card>}
  </View>;
}
