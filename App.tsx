import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/state';
import { Button, Card, Empty, Icon, ProfileAvatar, colors, s } from './src/ui';
import type { Route } from './src/navigation';
import { Auth, GuideDetail, Guides, Welcome } from './src/screens/public';
import { History, LogForm, Status } from './src/screens/logs';
import { CatForm, Cats, VaccineForm, Vaccines } from './src/screens/manage';
import { Account, Family, Profile } from './src/screens/account';

import { Admin } from './src/screens/admin';

const tabs = [{ name: 'guides', label: 'คู่มือ', icon: 'book-open-page-variant-outline' }, { name: 'status', label: 'ภาพรวม', icon: 'heart-outline' }, { name: 'log', label: 'บันทึก', icon: 'plus-circle-outline' }, { name: 'history', label: 'ประวัติ', icon: 'history' }, { name: 'account', label: 'บัญชี', icon: 'account-outline' }] as const;
function Application() {
  const app = useApp(); const [stack, setStack] = useState<Route[]>([{ name: 'welcome' }]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [menuError, setMenuError] = useState('');
  const routedUser = useRef('');
  useEffect(() => {
    if (app.mode !== 'live') { routedUser.current = ''; return; }
    if (app.data?.profile.id && routedUser.current !== app.data.profile.id) {
      routedUser.current = app.data.profile.id;
      setStack([{ name: app.data.profile.role === 'admin' ? 'admin' : 'status' }]);
    }
  }, [app.mode, app.data?.profile.id, app.data?.profile.role]);
  const route = stack[stack.length - 1];
  const navigate = (next: Route) => { setProfileMenuOpen(false); app.setNotice(''); setStack(s => [...s, next]); };
  const back = () => { setProfileMenuOpen(false); setStack(s => s.length > 1 ? s.slice(0, -1) : [{ name: 'guides' }]); };
  const signOutFromMenu = async () => {
    setSigningOut(true); setMenuError('');
    try { await app.leave(); setProfileMenuOpen(false); setStack([{ name: 'welcome' }]); }
    catch (error) { setMenuError(error instanceof Error ? error.message : 'ออกจากระบบไม่สำเร็จ'); }
    finally { setSigningOut(false); }
  };
  const props = { navigate, back };
  const privatePage = !['welcome', 'auth', 'guides', 'guide', 'care'].includes(route.name);
  useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (stack.length <= 1) return false; back(); return true; }); return () => sub.remove(); }, [stack.length]);
  useEffect(() => { if (app.mode === 'live' && ['welcome', 'auth'].includes(route.name)) setStack([{ name: 'status' }]); }, [app.mode]);
  const selected = ['guide','care'].includes(route.name) ? 'guides' : ['cat', 'cats', 'family', 'profile', 'vaccines', 'vaccine', 'admin'].includes(route.name) ? 'account' : route.name;
  let screen: React.ReactNode;
  if (privatePage && app.mode === 'guest') screen = <View style={{ gap: 20 }}><Empty icon="lock-outline" title="เก็บเรื่องราวของคุณไว้ด้วยกัน" detail="เข้าสู่ระบบเพื่อบันทึกข้อมูลแมว หรือทดลองด้วยข้อมูลสาธิต" /><Button title="เข้าสู่ระบบ / สมัครสมาชิก" onPress={() => navigate({ name: 'auth' })} /><Button title="ทดลองใช้ข้อมูลสาธิต" secondary onPress={app.enterDemo} /></View>;
  else if (privatePage && !app.data) screen = app.loading ? <ActivityIndicator size="large" color={colors.orange} /> : <Empty title="ยังโหลดข้อมูลไม่ได้" detail="ตรวจสอบการเชื่อมต่อแล้วกดลองใหม่ด้านบน" />;
  else switch (route.name) {
    case 'welcome': screen = <Welcome {...props} />; break;
    case 'auth': screen = <Auth {...props} />; break;
    case 'care': screen = <Guides {...props} care />; break;
    case 'guides': screen = <Guides {...props} />; break;
    case 'guide': screen = <GuideDetail {...props} guide={route.guide} />; break;
    case 'status': screen = <Status {...props} />; break;
    case 'history': screen = <History {...props} />; break;
    case 'log': screen = <LogForm {...props} log={route.log} />; break;
    case 'account': screen = <Account {...props} />; break;
    case 'cats': screen = <Cats {...props} />; break;
    case 'cat': screen = <CatForm {...props} cat={route.cat} />; break;
    case 'vaccines': screen = <Vaccines {...props} />; break;
    case 'vaccine': screen = <VaccineForm {...props} vaccine={route.vaccine} />; break;
    case 'family': screen = <Family />; break;
    case 'profile': screen = <Profile {...props} />; break;
    case 'admin': screen = <Admin />; break;
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}><StatusBar style="dark" /><View style={{ width: '100%', maxWidth: 600, alignSelf: 'center', flex: 1 }}>
    <View style={{paddingHorizontal:22,paddingVertical:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',zIndex:10}}><Pressable accessibilityRole="button" accessibilityLabel="หน้าแรก" onPress={()=>navigate({name:'welcome'})} style={s.row}><View style={{backgroundColor:colors.orange,borderRadius:12,padding:8}}><Icon name="cat" color="#fff" size={23}/></View><Text style={{color:colors.orange,fontSize:22,fontWeight:'900',letterSpacing:-0.8}}>CATCARE</Text></Pressable><View style={{flexDirection:'row',gap:8}}>{route.name!=='welcome'&&<Pressable accessibilityRole="button" accessibilityLabel="ย้อนกลับ" onPress={back} style={s.headerIcon}><Icon name="arrow-left" size={21} color={colors.dark}/></Pressable>}<Pressable accessibilityRole="button" accessibilityLabel="รีเฟรชข้อมูล" onPress={()=>void app.refresh()} style={s.headerIcon}><Icon name="refresh" size={21}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel="เปิดบัญชีของฉัน" accessibilityState={{expanded:profileMenuOpen}} onPress={()=>app.mode==='guest'?navigate({name:'auth'}):setProfileMenuOpen(open=>!open)} style={[s.headerIcon,{backgroundColor:colors.pale}]}>{app.mode==='guest'?<Icon name="account-circle-outline" size={26}/>:<ProfileAvatar uri={app.data?.profile.avatar_url} size={36} label="รูปโปรไฟล์ของฉัน" />}</Pressable>{profileMenuOpen&&app.mode!=='guest'&&<View style={{position:'absolute',top:48,right:0,width:205,backgroundColor:'#fff',borderColor:colors.line,borderWidth:1,borderRadius:16,padding:6,shadowColor:colors.dark,shadowOpacity:0.12,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:8}}><Pressable accessibilityRole="button" accessibilityLabel="ตั้งค่า" onPress={()=>navigate({name:'account'})} style={[s.row,{paddingHorizontal:12,paddingVertical:12}]}><Icon name="cog-outline" size={21}/><Text style={s.text}>ตั้งค่า</Text></Pressable><View style={s.divider}/><Pressable accessibilityRole="button" accessibilityLabel={app.mode==='demo'?'ออกจากโหมดสาธิต':'ออกจากระบบ'} disabled={signingOut} onPress={()=>void signOutFromMenu()} style={[s.row,{paddingHorizontal:12,paddingVertical:12,opacity:signingOut?0.6:1}]}><Icon name="logout" size={21}/><Text style={[s.text,{color:colors.orange}]}>{app.mode==='demo'?'ออกจากโหมดสาธิต':'ออกจากระบบ'}</Text></Pressable></View>}</View></View>
    {app.mode === 'demo' && <View style={{ backgroundColor: '#FBE1BA', padding: 7 }}><Text style={{ textAlign: 'center', color: '#855B2B', fontSize: 11 }}>โหมดสาธิต · ข้อมูลตัวอย่างเก็บบนเครื่องนี้</Text></View>}
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView key={stack.length + route.name} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={app.loading} onRefresh={() => void app.refresh()} tintColor={colors.orange} />}>
      {!!menuError && <Text accessibilityRole="alert" style={s.error}>{menuError}</Text>}
      {!!app.error && <Card><Text accessibilityRole="alert" style={s.error}>โหลดข้อมูลไม่สำเร็จ: {app.error}</Text><Button title="ลองโหลดอีกครั้ง" secondary onPress={() => void app.refresh()} /></Card>}
      {!!app.notice && <Pressable accessibilityRole="button" onPress={() => app.setNotice('')}><Text style={{ backgroundColor: '#E5F1E9', padding: 12, borderRadius: 12, color: colors.green }}>{app.notice}</Text></Pressable>}
      {screen}
    </ScrollView></KeyboardAvoidingView>
    {route.name !== 'auth' && <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line, backgroundColor: '#fff', paddingTop: 10, paddingBottom: 10, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>{tabs.map(tab => <Pressable key={tab.name} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{ selected: selected === tab.name }} onPress={() => { setProfileMenuOpen(false); app.setNotice(''); setStack([{ name: tab.name }]); }} style={{ flex: 1, alignItems: 'center', gap: 5, paddingVertical: 8, minHeight: 54, borderRadius: 18, marginHorizontal: 3, backgroundColor: selected === tab.name ? colors.pale : 'transparent' }}><Icon name={tab.icon} size={24} color={selected === tab.name ? colors.orange : colors.muted} /><Text style={{ fontSize: 10, color: selected === tab.name ? colors.orange : colors.muted, fontWeight: selected === tab.name ? '700' : '400' }}>{tab.label}</Text></Pressable>)}</View>}
  </View></SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><AppProvider><Application /></AppProvider></SafeAreaProvider>; }

