import React, { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Button, Card, CatArt, Chip, Empty, Field, Heading, Icon, colors, s } from '../ui';
import { useApp } from '../state';
import type { Category, Guide } from '../types';
import type { ScreenProps } from '../navigation';
import { configured } from '../lib/supabase';
import { signIn, signUp } from '../data/repository';
import { resendConfirmation } from '../lib/email-confirmation';

export { Welcome, Guides } from './discover';
export function Auth({ navigate }: ScreenProps) {
  const app = useApp();
  const [register, setRegister] = useState(false);
  const [identifier, setIdentifier] = useState(''); const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); const [first, setFirst] = useState(''); const [last, setLast] = useState('');
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function resend() {
    if (busy || cooldown > 0) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await resendConfirmation(confirmationEmail);
      setMessage('หากอีเมลนี้มีบัญชีที่รอยืนยัน ระบบจะส่งลิงก์ให้ กรุณาตรวจกล่องจดหมายและสแปม กดลิงก์แล้วกลับมาเข้าสู่ระบบ');
      setCooldown(60);
    } catch (e) { setError(e instanceof Error ? e.message : 'ส่งอีเมลไม่สำเร็จ'); }
    finally { setBusy(false); }
  }
  async function submit() {
    setError(''); setMessage(''); setBusy(true);
    try {
      if (register) {
        if (!first.trim() || !last.trim()) throw new Error('กรุณากรอกชื่อและนามสกุล');
        const result = await signUp({ email: identifier, password, username, full_name: `${first.trim()} ${last.trim()}` });
        if (!result.session) { setMessage(result.user?.identities?.length === 0 ? 'หากอีเมลนี้ยังไม่มีบัญชี กรุณาตรวจกล่องจดหมายเพื่อยืนยันอีเมล' : `ลงทะเบียนชื่อผู้ใช้ ${username.trim().toLowerCase()} แล้ว กรุณาตรวจอีเมลและกดลิงก์ยืนยัน ก่อนกลับมาเข้าสู่ระบบ`); setConfirmationEmail(identifier.trim()); setShowConfirmation(true); setCooldown(60); setRegister(false); setPassword(''); return; }
        navigate({ name: 'status' }); app.setNotice(`ลงทะเบียนชื่อผู้ใช้ ${username.trim().toLowerCase()} สำเร็จ`); return;
      } else await signIn(identifier, password);
      navigate({ name: 'status' });
    } catch (e) { setError(e instanceof Error ? e.message : 'ไม่สามารถเข้าสู่ระบบได้'); }
    finally { setBusy(false); }
  }
  return <View style={{ gap: 20 }}><View style={{ alignItems: 'center' }}><CatArt size={110} /></View>{register ? <Text accessibilityRole="header" style={[s.title, { textAlign: 'center' }]}>สร้างบัญชีผู้ใช้</Text> : <Heading title="ยินดีต้อนรับกลับมา" subtitle="วันนี้เจ้าเหมียวของคุณเป็นอย่างไรบ้าง?" />}
    {!configured && <Text style={s.error}>ยังไม่ได้เชื่อมต่อ Supabase สามารถอ่านคู่มือหรือทดลองข้อมูลสาธิตก่อนได้</Text>}
    {register && <><Field label="ชื่อ" value={first} onChangeText={setFirst} /><Field label="นามสกุล" value={last} onChangeText={setLast} /></>}
    <Field label={register ? 'อีเมล' : 'อีเมลหรือชื่อผู้ใช้'} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" autoCorrect={false} placeholder="you@example.com" keyboardType={register ? 'email-address' : 'default'} />
    {register && <Field label="ชื่อผู้ใช้" autoCapitalize="none" autoCorrect={false} value={username} onChangeText={setUsername} placeholder="catlover_01" maxLength={30} />}
    <Field label="รหัสผ่าน" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder={register ? 'อย่างน้อย 8 ตัวอักษร' : 'กรอกรหัสผ่าน'} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}{!!message && <Text style={s.text}>{message}</Text>}
    <Button title={register ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'} loading={busy} disabled={!configured} onPress={() => void submit()} />
    <Button title={register ? 'มีบัญชีแล้ว · เข้าสู่ระบบ' : 'ยังไม่มีบัญชี · สมัครสมาชิก'} secondary onPress={() => { setRegister(!register); setError(''); }} />
    {!register && <Button title="ยังไม่ได้รับอีเมลยืนยัน?" secondary disabled={busy} onPress={() => { setShowConfirmation(!showConfirmation); if (identifier.includes('@')) setConfirmationEmail(identifier.trim()); }} />}
    {!register && showConfirmation && <Card><Text style={s.h3}>ยืนยันอีเมลของคุณ</Text><Text style={s.muted}>กดลิงก์ในอีเมลจาก Cat Care / Supabase แล้วกลับมาเข้าสู่ระบบด้วยรหัสผ่านเดิม</Text><Field label="อีเมลสำหรับยืนยัน" value={confirmationEmail} onChangeText={setConfirmationEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}/><Button title={cooldown > 0 ? `ส่งใหม่ได้ใน ${cooldown} วินาที` : 'ส่งอีเมลยืนยันอีกครั้ง'} disabled={!configured || busy || cooldown > 0} onPress={() => void resend()}/></Card>}
    <Button title="ทดลองโหมดสาธิต" secondary onPress={() => { app.enterDemo(); navigate({ name: 'status' }); }} />
  </View>;
}
export function GuideDetail({ guide, navigate }: ScreenProps & { guide: Guide }) {
  const app = useApp();
  const [error, setError] = useState('');
  return <View style={{ gap: 22 }}><View style={{ backgroundColor: colors.pale, borderRadius: 26, padding: 22, alignItems: 'center', gap: 12 }}><CatArt size={150} /><Text style={[s.tag, { alignSelf: 'center' }]}>{guide.category}</Text></View><Heading title={guide.title} subtitle={guide.summary} /><Card><Text style={s.h3}>ท่าทางนี้บอกอะไรเรา</Text><Text style={s.text}>{guide.detail}</Text></Card><Card><View style={s.row}><Icon name="heart-outline" /><Text style={s.h3}>ดูแลเขาอย่างเข้าใจ</Text></View><Text style={s.text}>{guide.advice}</Text></Card>
    <Button title="อ่านแหล่งอ้างอิง" secondary icon="open-in-new" onPress={() => { void Linking.openURL(guide.source_url).catch(() => setError('เปิดแหล่งอ้างอิงไม่สำเร็จ')); }} />{!!error && <Text style={s.error}>{error}</Text>}
    <Button title="บันทึกพฤติกรรมที่พบ" icon="plus" onPress={() => navigate({ name: app.mode === 'guest' ? 'auth' : 'log' })} />
    <Text style={s.muted}>หากพฤติกรรมเปลี่ยนไปหรือสงสัยว่าเจ็บป่วย ควรปรึกษาสัตวแพทย์</Text>
  </View>;
}
