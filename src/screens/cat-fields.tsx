import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors, Icon, s } from '../ui';

const breeds = ['แมวบ้าน / พันธุ์ผสม', 'แมวไทย', 'วิเชียรมาศ', 'โคราช', 'เปอร์เซีย', 'บริติชชอร์ตแฮร์', 'สก็อตติชโฟลด์', 'อเมริกันชอร์ตแฮร์', 'เมนคูน', 'แร็กดอลล์', 'เบงกอล', 'สฟิงซ์', 'อื่น ๆ', 'ไม่ทราบสายพันธุ์'];
const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const pad = (value: number) => String(value).padStart(2, '0');

export function BreedPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const choices = value && !breeds.includes(value) ? [value, ...breeds] : breeds;
  return <View style={{ gap: 7 }}><Text style={s.label}>สายพันธุ์</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="สายพันธุ์" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={[s.input, s.row, { justifyContent: 'space-between' }]}><Text style={{ color: value ? colors.dark : colors.muted }}>{value || 'เลือกสายพันธุ์'}</Text><Icon name={open ? 'chevron-up' : 'chevron-down'} /></Pressable>
    {open && <ScrollView nestedScrollEnabled style={{ maxHeight: 220, backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: colors.line }} keyboardShouldPersistTaps="handled">{choices.map(choice => <Pressable key={choice} accessibilityRole="button" accessibilityLabel={`เลือกสายพันธุ์ ${choice}`} onPress={() => { onChange(choice); setOpen(false); }} style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}><Text style={{ color: choice === value ? colors.orange : colors.dark }}>{choice}</Text></Pressable>)}</ScrollView>}
  </View>;
}

export function BirthDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const today = new Date();
  const initial = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : today;
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [open, setOpen] = useState(false);
  const [yearsOpen, setYearsOpen] = useState(false);
  const year = month.getFullYear(); const monthIndex = month.getMonth();
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(0), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const shift = (delta: number) => setMonth(new Date(year, monthIndex + delta, 1));
  const years = Array.from({ length: today.getFullYear() - 1980 + 1 }, (_, i) => today.getFullYear() - i);
  return <View style={{ gap: 7 }}><Text style={s.label}>วันเกิด (ไม่บังคับ)</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="วันเกิด" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={[s.input, s.row, { justifyContent: 'space-between' }]}><Text style={{ color: value ? colors.dark : colors.muted }}>{value ? `${Number(value.slice(8, 10))} ${months[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}` : 'เลือกวันเกิดจากปฏิทิน'}</Text><Icon name="calendar-month-outline" /></Pressable>
    {open && <View style={{ padding: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', gap: 12 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}><Pressable accessibilityRole="button" accessibilityLabel="เดือนก่อนหน้า" onPress={() => shift(-1)}><Icon name="chevron-left" /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="เลือกปี" onPress={() => setYearsOpen(!yearsOpen)}><Text style={[s.h3, { color: colors.orange }]}>{months[monthIndex]} {year} ▾</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="เดือนถัดไป" disabled={year === today.getFullYear() && monthIndex >= today.getMonth()} onPress={() => shift(1)}><Icon name="chevron-right" color={year === today.getFullYear() && monthIndex >= today.getMonth() ? colors.line : colors.orange} /></Pressable></View>
      {yearsOpen ? <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}><View style={s.wrap}>{years.map(y => <Pressable key={y} accessibilityRole="button" accessibilityLabel={`ปี ${y}`} onPress={() => { setMonth(new Date(y, monthIndex, 1)); setYearsOpen(false); }} style={[s.chip, y === year && s.chipActive]}><Text style={[s.chipText, y === year && { color: '#fff' }]}>{y}</Text></Pressable>)}</View></ScrollView> : <><View style={{ flexDirection: 'row' }}>{['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((label, i) => <Text key={i} style={[s.muted, { width: `${100 / 7}%`, textAlign: 'center' }]}>{label}</Text>)}</View><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{cells.map((day, index) => { const key = `${year}-${pad(monthIndex + 1)}-${pad(day)}`; const disabled = !day || key > todayKey; return <Pressable key={index} accessibilityRole="button" accessibilityLabel={day ? `เลือกวันที่ ${day}` : undefined} disabled={disabled} onPress={() => { onChange(key); setOpen(false); }} style={{ width: `${100 / 7}%`, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: day && key === value ? colors.orange : 'transparent' }}><Text style={{ color: disabled ? colors.line : key === value ? '#fff' : colors.dark }}>{day || ''}</Text></Pressable>; })}</View></>}
      {!!value && <Pressable accessibilityRole="button" accessibilityLabel="ล้างวันเกิด" onPress={() => { onChange(''); setOpen(false); }}><Text style={{ color: colors.orange, textAlign: 'center' }}>ล้างวันเกิด</Text></Pressable>}
    </View>}
  </View>;
}
