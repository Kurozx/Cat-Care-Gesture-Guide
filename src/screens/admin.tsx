import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Chip, Field, Heading, ProfileAvatar, s } from '../ui';
import { useApp } from '../state';
import { useTask } from './manage';
import { adminChoices, adminDelete, adminRecords, adminSave, adminUpdateUser, type AdminRecord, type AdminTable } from '../data/admin';
import { BirthDatePicker, BreedPicker } from './cat-fields';

type FormField = { key: string; label: string; required?: boolean; multiline?: boolean; nullable?: boolean; options?: [string, string][]; bool?: boolean };
const sections: [AdminTable, string][] = [['guides','คู่มือ'],['cat_owners','ผู้ใช้'],['homes','บ้าน'],['cats','แมว'],['daily_logs','บันทึกพฤติกรรม'],['vaccinations','วัคซีน'],['admin_actions','ประวัติแอดมิน']];
const fields: Partial<Record<AdminTable, FormField[]>> = {
  cat_owners: [{key:'full_name',label:'ชื่อและนามสกุล',required:true},{key:'phone',label:'โทรศัพท์'},{key:'role',label:'บทบาท',options:[['user','User · ผู้ใช้'],['admin','Admin · ผู้ดูแลระบบ']]}],
  guides: [{key:'title',label:'ชื่อคู่มือ',required:true},{key:'category',label:'หมวดหมู่',options:['หาง','ใบหน้า','ท่าทาง','การดูแล'].map(v=>[v,v])},{key:'summary',label:'คำอธิบายย่อ'},{key:'detail',label:'รายละเอียด',required:true,multiline:true},{key:'advice',label:'คำแนะนำ',multiline:true},{key:'source_url',label:'แหล่งอ้างอิง HTTPS',required:true},{key:'published',label:'เผยแพร่',bool:true}],
  homes: [{key:'name',label:'ชื่อบ้าน',required:true},{key:'location',label:'ที่ตั้ง'},{key:'home_type',label:'ประเภทบ้าน'},{key:'is_active',label:'ใช้งานอยู่',bool:true}],
  cats: [{key:'name',label:'ชื่อแมว',required:true},{key:'breed',label:'สายพันธุ์'},{key:'birth_date',label:'วันเกิด',nullable:true},{key:'notes',label:'หมายเหตุ',multiline:true}],
  daily_logs: [{key:'title',label:'หัวข้อ',required:true},{key:'behavior',label:'พฤติกรรม',required:true},{key:'occurred_at',label:'วันเวลา (เช่น 2026-09-21T10:30:00+07:00)',required:true},{key:'level',label:'ระดับ',options:[['low','ต่ำ'],['medium','ปานกลาง'],['high','สูง']]},{key:'status',label:'สถานะ',options:[['observed','บันทึกแล้ว'],['follow_up','ติดตามอาการ'],['resolved','ติดตามแล้ว']]},{key:'note',label:'หมายเหตุ',multiline:true}],
  vaccinations: [{key:'name',label:'ชื่อวัคซีน / นัดหมาย',required:true},{key:'administered_on',label:'วันที่ได้รับ (YYYY-MM-DD)',nullable:true},{key:'due_at',label:'วันเวลานัด (เช่น 2026-10-21T10:30:00+07:00)',nullable:true},{key:'note',label:'หมายเหตุ',multiline:true}],
};
const titleOf = (row: AdminRecord) => row.title || row.name || row.full_name || row.action || row.id;

export function Admin() {
  const app = useApp(); const task = useTask();
  const [table,setTable] = useState<AdminTable>('guides'); const [rows,setRows] = useState<AdminRecord[]>([]);
  const [page,setPage] = useState(0); const [query,setQuery] = useState(''); const [ready,setReady] = useState(false);
  const [edit,setEdit] = useState<AdminRecord|null>(null); const [remove,setRemove] = useState<AdminRecord|null>(null); const [confirmRole,setConfirmRole] = useState(false);
  const [choices,setChoices] = useState<{homes:AdminRecord[];cats:AdminRecord[];cat_owners:AdminRecord[]}>({homes:[],cats:[],cat_owners:[]});
  const permitted = app.mode === 'live' && app.data?.profile.role === 'admin';
  useEffect(() => {
    let active = true; setReady(false); setRows([]); setEdit(null); setRemove(null); setConfirmRole(false);
    if (permitted) void task.run(async () => { const data = await adminRecords(table,page); if(active) {setRows(data);setReady(true);} });
    return () => { active=false; };
  }, [table,page,permitted]);
  if (!permitted) return <Text style={s.error}>เฉพาะผู้ดูแลระบบเท่านั้น</Text>;
  async function reload() { setRows(await adminRecords(table,page)); await app.refresh(); }
  async function create() {
    const [homes,cats,users] = await Promise.all([adminChoices('homes'),adminChoices('cats'),adminChoices('cat_owners')]);
    setChoices({homes,cats,cat_owners:users});
    const row: AdminRecord = {id:''};
    for(const field of fields[table] ?? []) row[field.key] = field.bool ? false : field.options?.[0][0] ?? '';
    if(table==='homes') {row.owner_id=app.data!.profile.id;row.home_type='บ้าน';row.is_active=true;}
    if(table==='guides') row.icon='cat';
    if(table==='daily_logs') row.occurred_at=new Date().toISOString();
    setEdit(row);
  }
  async function save() {
    if(!edit) return;
    for(const f of fields[table] ?? []) if(f.required && !String(edit[f.key]??'').trim()) throw new Error(`กรุณากรอก${f.label}`);
    if(table==='cat_owners') await adminUpdateUser(edit);
    else {
      const payload:Record<string,unknown> = {};
      for(const f of fields[table] ?? []) { const v=edit[f.key];payload[f.key]=f.bool?Boolean(v):f.nullable&&!String(v??'').trim()?null:String(v??'').trim(); }
      if(table==='guides') { if(!String(payload.source_url).startsWith('https://')) throw new Error('กรุณาระบุลิงก์ HTTPS');payload.icon=edit.icon||'cat'; }
      if(!edit.id) for(const key of table==='homes'?['owner_id']:table==='cats'?['home_id']:['daily_logs','vaccinations'].includes(table)?['home_id','cat_id']:[]) { if(!edit[key]) throw new Error('กรุณาเลือกบ้าน / แมว / เจ้าของให้ครบ');payload[key]=edit[key]; }
      await adminSave(table,edit.id||null,payload);
    }
    setEdit(null);setConfirmRole(false);await reload();app.setNotice('บันทึกข้อมูลแล้ว');
  }
  const filtered = rows.filter(r=>[titleOf(r),r.username,r.email,r.behavior].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={{gap:18}}><Heading title="แผงควบคุมแอดมิน" subtitle="จัดการข้อมูลแอปและสิทธิ์ผู้ใช้" />
    <View style={s.wrap}>{sections.map(([key,label])=><Chip key={key} text={label} active={table===key} onPress={()=>{setTable(key);setPage(0);setQuery('');}} />)}</View>
    {!!task.error && <Text accessibilityRole="alert" style={s.error}>{task.error}</Text>}
    {edit ? <Card><Heading title={`${edit.id?'แก้ไข':'เพิ่ม'}${sections.find(x=>x[0]===table)?.[1]}`} />
      {table==='cat_owners' && <Text style={s.muted}>@{edit.username} · {edit.email}{'\n'}{edit.email_confirmed_at?'ยืนยันอีเมลแล้ว':'ยังไม่ยืนยันอีเมล'}</Text>}
      {!edit.id && table==='homes' && <><Text style={s.label}>เจ้าของบ้าน</Text><View style={s.wrap}>{choices.cat_owners.map(u=><Chip key={u.id} text={`@${u.username}`} active={edit.owner_id===u.id} onPress={()=>setEdit({...edit,owner_id:u.id})} />)}</View></>}
      {!edit.id && ['cats','daily_logs','vaccinations'].includes(table) && <><Text style={s.label}>เลือกบ้าน</Text><View style={s.wrap}>{choices.homes.map(h=><Chip key={h.id} text={h.name} active={edit.home_id===h.id} onPress={()=>setEdit({...edit,home_id:h.id,cat_id:''})} />)}</View>{!choices.homes.length&&<Text>กรุณาเพิ่มบ้านก่อน</Text>}</>}
      {!edit.id && ['daily_logs','vaccinations'].includes(table) && <><Text style={s.label}>เลือกแมว</Text><View style={s.wrap}>{choices.cats.filter(c=>c.home_id===edit.home_id).map(c=><Chip key={c.id} text={c.name} active={edit.cat_id===c.id} onPress={()=>setEdit({...edit,cat_id:c.id})} />)}</View></>}
      {(fields[table]??[]).map(f=><View key={f.key} style={{gap:8}}>{table==='cats'&&f.key==='breed'?<BreedPicker value={String(edit[f.key]??'')} onChange={v=>setEdit({...edit,[f.key]:v})} />:table==='cats'&&f.key==='birth_date'?<BirthDatePicker value={String(edit[f.key]??'')} onChange={v=>setEdit({...edit,[f.key]:v})} />:f.options?<><Text style={s.label}>{f.label}</Text><View style={s.wrap}>{f.options.map(([value,label])=><Chip key={value} text={label} active={edit[f.key]===value} onPress={()=>{setConfirmRole(false);setEdit({...edit,[f.key]:value});}} />)}</View></>:f.bool?<Chip text={`${f.label}: ${edit[f.key]?'ใช่':'ไม่'}`} active={!!edit[f.key]} onPress={()=>setEdit({...edit,[f.key]:!edit[f.key]})} />:<Field label={f.label} value={String(edit[f.key]??'')} onChangeText={v=>setEdit({...edit,[f.key]:v})} multiline={f.multiline} autoCapitalize="none" />}</View>)}
      {confirmRole && <Text style={s.error}>ยืนยันเปลี่ยนบทบาท @{edit.username} เป็น {edit.role}? แอดมินสามารถจัดการข้อมูลและสิทธิ์ผู้ใช้ทั้งหมดได้</Text>}
      <Button title={confirmRole?'ยืนยันเปลี่ยนบทบาทและบันทึก':'บันทึกข้อมูล'} loading={task.busy} onPress={()=>{if(table==='cat_owners'&&rows.find(r=>r.id===edit.id)?.role!==edit.role&&!confirmRole){setConfirmRole(true);return;}void task.run(save);}} />
      <Button title="ยกเลิก" secondary disabled={task.busy} onPress={()=>{setEdit(null);setConfirmRole(false);}} />
    </Card> : remove ? <Card><Heading title={`ลบ ${titleOf(remove)}`} /><Text style={s.error}>{table==='homes'?'การลบบ้านจะลบแมว บันทึก วัคซีน และสมาชิกในบ้านนี้ด้วย':table==='cats'?'การลบแมวจะลบบันทึกและวัคซีนของแมวนี้ด้วย':table==='cat_owners'?'การลบบัญชีจะทำให้เข้าสู่ระบบไม่ได้ หากยังมีบ้านหรือประวัติบันทึก ระบบจะไม่อนุญาตให้ลบ':'ข้อมูลนี้จะถูกลบถาวร'}</Text><Button title="ยืนยันลบถาวร" danger loading={task.busy} onPress={()=>void task.run(async()=>{await adminDelete(table,remove.id);setRemove(null);await reload();app.setNotice('ลบข้อมูลแล้ว');})} /><Button title="ยกเลิก" secondary disabled={task.busy} onPress={()=>setRemove(null)} /></Card> : <>
      <Field label="ค้นหาในหน้านี้" value={query} onChangeText={setQuery} />
      <View style={s.row}><Text style={[s.h3,{flex:1}]}>{sections.find(x=>x[0]===table)?.[1]} · หน้า {page+1}</Text><Button title="รีเฟรช" secondary loading={task.busy} onPress={()=>void task.run(reload)} /></View>
      {!['cat_owners','admin_actions'].includes(table)&&<Button title={`เพิ่ม${sections.find(x=>x[0]===table)?.[1]}`} loading={task.busy} onPress={()=>void task.run(create)} />}
      {table==='cat_owners'&&<Text style={s.muted}>บัญชีใหม่สมัครผ่านหน้าสมัครสมาชิก และเริ่มต้นด้วยสิทธิ์ User เสมอ</Text>}
      {ready&&!filtered.length&&<Text style={s.muted}>ไม่พบข้อมูล</Text>}
      {filtered.map(row=><Card key={row.id}><View style={s.row}>{table==='cat_owners'&&<ProfileAvatar uri={row.avatar_url} size={56} label={`รูปโปรไฟล์ ${row.full_name || row.username}`} />}<Text style={[s.h3,{flex:1}]}>{titleOf(row)}</Text></View>
        <Text style={s.muted}>{table==='cat_owners'?`@${row.username} · ${row.role}\n${row.email}\n${row.email_confirmed_at?'ยืนยันอีเมลแล้ว':'รอยืนยันอีเมล'}`:table==='guides'?`${row.category} · ${row.published?'เผยแพร่':'ฉบับร่าง'}`:table==='admin_actions'?`${row.target_table} · ${row.target_id}\n${row.created_at}`:row.note||row.notes||row.location||row.behavior||'แตะแก้ไขเพื่อดูรายละเอียด'}</Text>
        {table!=='admin_actions'&&<><Button title={`แก้ไข ${titleOf(row)}`} secondary disabled={task.busy} onPress={()=>{setEdit({...row});setConfirmRole(false);}} /><Button title={`ลบ ${titleOf(row)}`} secondary disabled={task.busy||(table==='cat_owners'&&row.id===app.data?.profile.id)} onPress={()=>setRemove(row)} /></>}
      </Card>)}
      <View style={s.row}><Button title="ก่อนหน้า" secondary disabled={page===0||task.busy} onPress={()=>setPage(page-1)} /><Button title="ถัดไป" secondary disabled={rows.length<100||task.busy} onPress={()=>setPage(page+1)} /></View>
    </>}
  </View>;
}
