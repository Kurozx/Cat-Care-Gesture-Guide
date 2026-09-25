import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, Text, View } from 'react-native';
import { useApp } from '../state';
import { Button, Card, CatArt, Chip, Field, Heading, Icon, ProfileAvatar, colors, s } from '../ui';
import * as repo from '../data/repository';
import type { ScreenProps, Route } from '../navigation';
import type { Guide } from '../types';
import { useTask } from './manage';

export function Account({ navigate }: ScreenProps) {
  const app = useApp(); const task = useTask(); const [reset, setReset] = useState(false);
  const links: { label: string; icon: string; route: Route }[] = [
    { label: 'แก้ไขโปรไฟล์', icon: 'account-edit-outline', route: { name: 'profile' } },
    { label: 'แมวและบ้านของเรา', icon: 'cat', route: { name: 'cats' } },
    { label: 'สมาชิกครอบครัว', icon: 'account-group-outline', route: { name: 'family' } },
    { label: 'วัคซีนและการแจ้งเตือน', icon: 'bell-outline', route: { name: 'vaccines' } },
  ];
  return <View style={{ gap: 26 }}><Heading title="โปรไฟล์และการตั้งค่า" subtitle="พื้นที่ของคุณกับเจ้าเหมียว" />
    <View style={{backgroundColor:colors.pale,borderRadius:28,padding:24,alignItems:'center',gap:12}}><Pressable accessibilityRole="button" accessibilityLabel="แก้ไขรูปโปรไฟล์" onPress={()=>navigate({name:'profile'})}><ProfileAvatar uri={app.data?.profile.avatar_url} size={100} label="รูปโปรไฟล์"/><View style={{position:'absolute',right:0,bottom:0,backgroundColor:'#fff',borderRadius:16,padding:5}}><Icon name="camera-outline" size={20}/></View></Pressable><Text style={[s.title,{textAlign:'center'}]}>{app.data?.profile.username}</Text><Text style={s.muted}>{app.data?.profile.full_name}</Text></View>
    <View style={{flexDirection:'row',gap:10}}>{[{icon:'cat',value:app.data?.cats.length??0,label:'เจ้าเหมียว'},{icon:'notebook-outline',value:app.data?.logs.length??0,label:'บันทึก'},{icon:'home-heart',value:app.data?.homes.length??0,label:'บ้าน'}].map(item=><View key={item.label} style={{flex:1,backgroundColor:'#fff',borderRadius:20,paddingVertical:18,alignItems:'center',gap:7}}><Icon name={item.icon}/><Text style={[s.h3,{fontSize:24}]}>{item.value}</Text><Text style={s.muted}>{item.label}</Text></View>)}</View>
    {!app.data?.cats.length&&<View style={{backgroundColor:colors.pale,borderRadius:24,padding:20,gap:14}}><Text style={s.h3}>เริ่มต้นเรื่องราวของเจ้าเหมียว</Text><Text style={s.muted}>เพิ่มโปรไฟล์แมวตัวแรก เพื่อเริ่มบันทึกพฤติกรรมและติดตามนัดหมายไปด้วยกัน</Text><Button title="สร้างโปรไฟล์เจ้าเหมียว" icon="plus-circle-outline" onPress={()=>navigate({name:'cats'})}/></View>}
    <Text style={s.h3}>การจัดการโปรไฟล์ & แมว</Text><Card>{links.map((l,i) => <Pressable key={l.label} accessibilityRole="button" accessibilityLabel={l.label} onPress={() => navigate(l.route)} style={[s.row, { minHeight: 66,borderBottomWidth:i<links.length-1?1:0,borderColor:'#F5E9E0',paddingBottom:i<links.length-1?12:0 }]}><View style={{padding:11,borderRadius:15,backgroundColor:colors.cream}}><Icon name={l.icon} /></View><View style={{flex:1,gap:3}}><Text style={[s.text,{fontWeight:'600'}]}>{l.label}</Text><Text style={[s.muted,{fontSize:11}]}>{['ชื่อและข้อมูลติดต่อของคุณ','ดูแลข้อมูลของสมาชิกตัวน้อย','แบ่งปันการดูแลกับคนในบ้าน','วางแผนการดูแลครั้งถัดไป'][i]}</Text></View><Icon name="chevron-right" size={19} color={colors.muted}/></Pressable>)}</Card>
    {app.data?.profile.role === 'admin' && <Button title="แผงควบคุมแอดมิน" secondary onPress={() => navigate({ name: 'admin' })} />}
    <Card><Text style={s.h3}>เกี่ยวกับ Cat Care</Text><Text style={s.muted}>คู่มือดูแลและบันทึกพฤติกรรมแมว เวอร์ชัน 1.0{ '\n' }ข้อมูลส่วนตัวถูกแบ่งสิทธิ์ตามสมาชิกในบ้าน คู่มือระบุแหล่งอ้างอิงในหน้ารายละเอียด</Text><Text style={s.muted}>กำหนดการวัคซีนและการรักษาควรอ้างอิงสัตวแพทย์ แอปนี้ไม่มีบริการแชตหรือการจองคลินิก</Text></Card>
    {app.mode === 'demo' && (reset ? <Card><Text style={s.text}>คืนค่าข้อมูลสาธิตเริ่มต้นและลบสิ่งที่ทดลองบันทึก?</Text><Button title="ยืนยันรีเซ็ตข้อมูลสาธิต" loading={task.busy} onPress={() => void task.run(async () => { await repo.resetDemo(); await app.refresh(); setReset(false); app.setNotice('คืนค่าข้อมูลสาธิตแล้ว'); })} /><Button title="ยกเลิก" secondary onPress={() => setReset(false)} /></Card> : <Button title="รีเซ็ตข้อมูลสาธิต" secondary onPress={() => setReset(true)} />)}
    {!!task.error && <Text style={s.error}>{task.error}</Text>}<Button title={app.mode === 'demo' ? 'ออกจากโหมดสาธิต' : 'ออกจากระบบ'} secondary icon="logout" loading={task.busy} onPress={() => void task.run(async () => { await app.leave(); navigate({ name: 'welcome' }); })} />
  </View>;
}
export function Profile({ back }: ScreenProps) {
  const app = useApp(); const task = useTask(); const [name, setName] = useState(app.data?.profile.full_name ?? ''); const [phone, setPhone] = useState(app.data?.profile.phone ?? '');
  const [photo, setPhoto] = useState<repo.ProfilePhoto | null | undefined>();
  const preview = photo ? `data:${photo.mimeType};base64,${photo.base64}` : photo === null ? undefined : app.data?.profile.avatar_url;
  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:0.7,base64:true});
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) throw new Error('อ่านรูปไม่สำเร็จ กรุณาเลือกรูปใหม่');
    // Identify the encoded bytes; the picker may convert the original image.
    const mimeType = asset.base64.startsWith('/9j/') ? 'image/jpeg' : asset.base64.startsWith('iVBOR') ? 'image/png' : asset.base64.startsWith('UklGR') ? 'image/webp' : '';
    if (!mimeType || asset.base64.length > 2796204) throw new Error('เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 2 MB');
    setPhoto({base64:asset.base64,mimeType});
  }
  return <View style={{ gap: 20 }}><Heading title="แก้ไขโปรไฟล์" subtitle={`ชื่อผู้ใช้ @${app.data?.profile.username}`} /><View style={{alignItems:'center'}}><ProfileAvatar uri={preview} size={120} label="ตัวอย่างรูปโปรไฟล์"/></View><Button title="เลือกรูปโปรไฟล์" secondary icon="image-outline" loading={task.busy} onPress={()=>void task.run(choosePhoto)}/><Text style={s.muted}>JPG, PNG หรือ WebP ไม่เกิน 2 MB รูปจะเปลี่ยนเมื่อกดบันทึก</Text>{!!preview&&<Button title="ใช้รูปเริ่มต้น" secondary disabled={task.busy} onPress={()=>setPhoto(null)}/>}<Field label="ชื่อและนามสกุล" value={name} onChangeText={setName} maxLength={120} /><Field label="โทรศัพท์" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />{!!task.error && <Text style={s.error}>{task.error}</Text>}<Button title="บันทึกโปรไฟล์" loading={task.busy} onPress={() => void task.run(async () => { await repo.saveProfile(app.mode, name.trim(), phone.trim(), photo); await app.refresh(); app.setNotice('บันทึกโปรไฟล์แล้ว'); back(); })} /></View>;
}
export function Family() {
  const app = useApp(); const task = useTask(); const [home, setHome] = useState(app.data?.homes[0]?.id ?? ''); const [username, setUsername] = useState(''); const [remove, setRemove] = useState('');
  const chosen = app.data?.homes.find(h => h.id === home); const owner = chosen?.owner_id === app.data?.profile.id;
  return <View style={{ gap: 20 }}><Heading title="ดูแลด้วยกันทั้งบ้าน" subtitle="สมาชิกอ่านและบันทึกข้อมูลแมวในบ้านร่วมกันได้" /><View style={s.wrap}>{app.data?.homes.map(h => <Chip key={h.id} text={h.name} active={home === h.id} onPress={() => { setHome(h.id); setRemove(''); }} />)}</View>
    {app.data?.members.filter(m => m.home_id === home).map(m => <Card key={m.user_id}><View style={s.row}><Icon name="account-circle-outline" size={36} /><View style={{ flex: 1 }}><Text style={s.h3}>{m.full_name}</Text><Text style={s.muted}>@{m.username} · {m.user_id === chosen?.owner_id ? 'เจ้าของบ้าน' : 'สมาชิก'}</Text></View></View>{owner && m.user_id !== app.data?.profile.id && (remove === m.user_id ? <><Text style={s.text}>ยกเลิกสิทธิ์เข้าถึงบ้านของสมาชิกนี้?</Text><Button title="ยืนยันนำสมาชิกออก" danger loading={task.busy} onPress={() => void task.run(async () => { await repo.removeMember(app.mode, home, m.user_id); await app.refresh(); setRemove(''); })} /><Button title="ยกเลิก" secondary onPress={() => setRemove('')} /></> : <Button title="นำสมาชิกออก" secondary onPress={() => setRemove(m.user_id)} />)}</Card>)}
    {owner && <Card><Text style={s.h3}>เพิ่มสมาชิกที่ลงทะเบียนแล้ว</Text><Text style={s.muted}>เมื่อเพิ่มแล้ว ผู้ใช้นี้จะเข้าถึงข้อมูลแมวและบันทึกทั้งหมดในบ้านนี้ได้</Text><Field label="ชื่อผู้ใช้ของสมาชิก" autoCapitalize="none" value={username} onChangeText={setUsername} placeholder="username" /><Button title="เพิ่มสมาชิกในบ้าน" loading={task.busy} onPress={() => void task.run(async () => { await repo.addMember(app.mode, home, username.trim()); await app.refresh(); setUsername(''); app.setNotice('เพิ่มสมาชิกแล้ว'); })} /></Card>}
    {!chosen && <Text style={s.muted}>สร้างบ้านในเมนูแมวและบ้านของเราก่อน</Text>}{!!task.error && <Text style={s.error}>{task.error}</Text>}
  </View>;
}

