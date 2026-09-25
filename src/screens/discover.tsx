import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, CatArt, Chip, Empty, Icon, colors, s } from '../ui';
import { useApp } from '../state';
import type { ScreenProps } from '../navigation';
import type { Category, Guide } from '../types';

export const design = StyleSheet.create({
  section: { gap: 18 },
  hero: { backgroundColor: colors.orange, borderRadius: 28, padding: 24, gap: 16, overflow: 'hidden' },
  heroTitle: { color: '#fff', fontSize: 27, lineHeight: 39, fontWeight: '800' },
  heroText: { color: '#FFF9F3', fontSize: 14, lineHeight: 23 },
  eyebrow: { color: colors.orange, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  search: { backgroundColor: '#F4ECE5', borderRadius: 28, paddingHorizontal: 18, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 14, fontSize: 14, color: colors.dark },
  circle: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
  article: { flex: 1, minWidth: 0, borderRadius: 24, overflow: 'hidden', backgroundColor: '#fff' },
  articleBody: { padding: 16, gap: 10 },
  tip: { padding: 20, borderRadius: 24, backgroundColor: colors.pale, gap: 12 },
  card: { padding: 20, borderRadius: 26, backgroundColor: '#fff', gap: 18 },
});

function Section({ title, subtitle, action, onPress }: { title: string; subtitle?: string; action?: string; onPress?: () => void }) {
  return <View style={[s.row,{justifyContent:'space-between',alignItems:'flex-start'}]}><View style={{flex:1,gap:3}}><Text style={s.h3}>{title}</Text>{subtitle&&<Text style={s.muted}>{subtitle}</Text>}</View>{action&&<Pressable accessibilityRole="button" accessibilityLabel={action} onPress={onPress} style={{paddingVertical:5}}><Text style={{color:colors.orange,fontWeight:'700',fontSize:12}}>{action} →</Text></Pressable>}</View>;
}
function Search({ value, onChange }: { value:string;onChange:(s:string)=>void }) {
  return <View style={design.search}><Icon name="magnify" color={colors.muted} size={22}/><TextInput accessibilityLabel="ค้นหาคู่มือ" placeholder="ค้นหาท่าทาง อาหาร หรือวิธีดูแล…" placeholderTextColor={colors.muted} value={value} onChangeText={onChange} style={design.searchInput}/></View>;
}
export function Welcome({navigate}:ScreenProps) {
  const app=useApp();
  const articles=app.guides.filter(g=>g.published).slice(0,2);
  return <View style={{gap:30}}>
    <View style={{gap:7}}><Text style={design.eyebrow}>A LITTLE CARE, EVERY DAY</Text><Text style={[s.title,{fontSize:30,lineHeight:42}]}>โลกเล็ก ๆ ของเขา{ '\n' }ที่เราเข้าใจได้มากขึ้น</Text><Text style={s.muted}>คู่มือและเรื่องราวดี ๆ สำหรับคุณกับเจ้าเหมียว</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="ค้นหาเรื่องดูแลแมว" onPress={()=>navigate({name:'guides'})}><View style={design.search}><Icon name="magnify" color={colors.muted}/><Text style={[s.muted,{flex:1}]}>ค้นหาท่าทาง อาหาร หรือวิธีดูแล…</Text><Icon name="tune-variant" size={20}/></View></Pressable>
    <View style={design.section}><Section title="อยากรู้เรื่องไหนวันนี้?"/><View style={{flexDirection:'row',gap:12}}>{[{icon:'paw',label:'ภาษากาย',route:'guides'},{icon:'heart-pulse',label:'การดูแล',route:'care'},{icon:'notebook-heart-outline',label:'บันทึกของเรา',route:'history'}].map((c,i)=><Pressable key={c.label} accessibilityRole="button" accessibilityLabel={c.label} onPress={()=>navigate({name:c.route as 'guides'|'care'|'history'})} style={{flex:1,alignItems:'center',gap:10}}><View style={[design.circle,i===0&&{backgroundColor:colors.orange}]}><Icon name={c.icon} size={30} color={i===0?'#fff':colors.orange}/></View><Text style={[s.label,{textAlign:'center'}]}>{c.label}</Text></Pressable>)}</View></View>
    <View style={design.hero}><View style={[s.row,{alignItems:'flex-start'}]}><View style={{flex:1,gap:12}}><Text style={[design.eyebrow,{color:'#FFE1BD'}]}>CAT CARE & GESTURE GUIDE</Text><Text style={design.heroTitle}>ทุกท่าทาง{ '\n' }มีเรื่องอยากบอก</Text></View><View style={{marginRight:-24,marginTop:20}}><CatArt size={112}/></View></View><Text style={design.heroText}>เรียนรู้ภาษาของหาง ใบหน้า และท่าทาง{ '\n' }เพื่อดูแลกันอย่างเข้าใจในทุกวัน</Text><Button title="อ่านคู่มือโดยไม่เข้าสู่ระบบ" secondary icon="arrow-right" onPress={()=>navigate({name:'guides'})}/></View>
    <View style={design.section}><Section title="เริ่มรู้จักเจ้าเหมียว" subtitle="ค่อย ๆ สังเกต แล้วคุณจะเข้าใจเขามากขึ้น" action="ดูคู่มือทั้งหมด" onPress={()=>navigate({name:'guides'})}/><View style={{flexDirection:'row',gap:14}}>{articles.map((g,i)=><Pressable key={g.id} style={design.article} accessibilityRole="button" accessibilityLabel={g.title} onPress={()=>navigate({name:'guide',guide:g})}><View style={{backgroundColor:i===0?'#FBE4CF':'#F2EDE4',alignItems:'center',padding:16}}><CatArt size={106}/></View><View style={design.articleBody}><Text style={[design.eyebrow,{fontSize:10}]}>{g.category}</Text><Text style={[s.h3,{fontSize:15,lineHeight:24}]} numberOfLines={3}>{g.title}</Text><Text style={s.muted} numberOfLines={2}>{g.summary}</Text><Icon name="arrow-right-circle" size={28}/></View></Pressable>)}</View></View>
    <View style={design.tip}><View style={s.row}><Icon name="lightbulb-on-outline"/><Text style={s.h3}>สังเกตให้ครบ แล้วค่อยตีความ</Text></View><Text style={s.muted}>ดูหู หาง ดวงตา และสถานการณ์รอบตัวประกอบกัน ท่าทางเดียวอาจมีความหมายต่างกันได้</Text></View>
    <View style={{gap:12}}><Section title="เก็บทุกวันดี ๆ ไว้ด้วยกัน" subtitle="สร้างโปรไฟล์แมว บันทึกพฤติกรรม และติดตามนัดหมาย"/><Button title="เริ่มต้นใช้งาน" icon="arrow-right" onPress={()=>navigate({name:app.mode==='guest'?'auth':'status'})}/><Button title="ทดลองใช้ด้วยข้อมูลสาธิต" secondary onPress={()=>{app.enterDemo();navigate({name:'status'});}}/></View>
  </View>;
}
export function Guides({navigate,care=false}:ScreenProps&{care?:boolean}) {
  const app=useApp();const [query,setQuery]=useState('');const [category,setCategory]=useState<Category>('ทั้งหมด');
  const items=app.guides.filter(g=>g.published&&(!care||g.category==='การดูแล')&&(category==='ทั้งหมด'||g.category===category)&&`${g.title} ${g.summary} ${g.detail}`.includes(query.trim()));
  return <View style={{gap:24}}><View style={{gap:6}}><Text style={design.eyebrow}>{care?'EVERYDAY WELLBEING':'THE LITTLE LANGUAGE OF CATS'}</Text><Text style={s.title}>{care?'ดูแลเขาในทุกวัน':'คู่มือดูแลแมว'}</Text><Text style={s.muted}>{care?'ตั้งแต่อาหารมื้อเล็ก ๆ ถึงเรื่องสุขภาพที่ควรใส่ใจ':'อ่านภาษากาย แล้วเข้าใจสิ่งที่เขาอยากบอก'}</Text></View><Search value={query} onChange={setQuery}/>
    {!care&&<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{(['ทั้งหมด','หาง','ใบหน้า','ท่าทาง','การดูแล'] as Category[]).map(c=><Chip key={c} text={c} active={category===c} onPress={()=>setCategory(c)}/>)}</ScrollView>}
    <View style={design.hero}><View style={s.row}><Icon name={care?'heart-pulse':'paw'} color="#fff"/><Text style={[s.label,{color:'#fff'}]}>{care?'เล็ก ๆ น้อย ๆ แต่สำคัญ':'เริ่มจากสิ่งที่สังเกตเห็น'}</Text></View><Text style={[design.heroTitle,{fontSize:23,lineHeight:33}]}>{care?'ดูแลสม่ำเสมอ\nเพื่อวันที่ดีของเจ้าเหมียว':'วันนี้เขากำลัง\nรู้สึกแบบไหนนะ?'}</Text><Text style={design.heroText}>{care?'อาหาร น้ำสะอาด และพื้นที่พักผ่อน เป็นส่วนหนึ่งของการดูแลที่ทำได้ทุกวัน':'สังเกตท่าทางควบคู่กับบริบท และให้พื้นที่เมื่อเขาต้องการพัก'}</Text></View>
    <Section title={care?'เรื่องดูแลที่ควรรู้':'ท่าทางและเรื่องน่ารู้'} subtitle={`${items.length} เรื่องสำหรับคุณกับเจ้าเหมียว`}/>
    {items.map(g=><Pressable key={g.id} accessibilityRole="button" accessibilityLabel={g.title} onPress={()=>navigate({name:'guide',guide:g})} style={({pressed})=>[design.card,{opacity:pressed?0.8:1}]}><View style={[s.row,{alignItems:'flex-start'}]}><View style={{width:66,height:72,borderRadius:20,backgroundColor:colors.pale,alignItems:'center',justifyContent:'center'}}><Icon name={g.icon} size={34}/></View><View style={{flex:1,gap:7}}><Text style={s.tag}>{g.category}</Text><Text style={s.h3}>{g.title}</Text><Text style={s.muted}>{g.summary}</Text></View></View><View style={[s.row,{backgroundColor:colors.cream,borderRadius:18,padding:12,justifyContent:'space-between'}]}><Text style={[s.label,{fontSize:12,color:colors.muted}]}>{care?'ค่อย ๆ ดูแล ไปด้วยกัน':'เข้าใจเขาให้มากขึ้น'}</Text><View style={s.row}><Text style={{color:colors.orange,fontWeight:'700',fontSize:12}}>อ่านคำแนะนำ</Text><Icon name="arrow-right" size={18}/></View></View></Pressable>)}
    {!items.length&&<Empty title="ไม่พบคู่มือ" detail="ลองเปลี่ยนคำค้นหรือหมวดหมู่"/>}
    <View style={design.tip}><Icon name="lightbulb-on-outline"/><Text style={s.h3}>ดูหลายสัญญาณประกอบกันเสมอ</Text><Text style={s.muted}>เนื้อหานี้ช่วยให้สังเกตพฤติกรรมได้ดีขึ้น หากพบอาการผิดปกติหรือกังวลเรื่องสุขภาพ ควรปรึกษาสัตวแพทย์</Text></View>
  </View>;
}
