import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Circle, Path, Ellipse } from 'react-native-svg';

export const colors = { orange: '#E75C19', dark: '#33251F', muted: '#8C7B70', cream: '#FFF9F3', pale: '#FFF0E4', line: '#F0DCCF', green: '#42846C', red: '#BE423D' };
export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
export const Icon = ({ name, size = 24, color = colors.orange }: { name: string; size?: number; color?: string }) => <MaterialCommunityIcons accessible={false} aria-hidden name={name as IconName} size={size} color={color} />;
export function Button({ title, onPress, secondary = false, danger = false, loading = false, disabled = false, icon }: { title: string; onPress: () => void; secondary?: boolean; danger?: boolean; loading?: boolean; disabled?: boolean; icon?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, danger && { backgroundColor: colors.red }, (pressed || disabled || loading) && { opacity: 0.6 }]}>{loading ? <ActivityIndicator color={secondary ? colors.orange : '#fff'} /> : <>{icon && <Icon name={icon} size={20} color={secondary ? colors.orange : '#fff'} />}<Text style={[s.buttonText, secondary && { color: colors.orange }]}>{title}</Text></>}</Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) { return <View style={{ gap: 7 }}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#A7968A" {...props} style={[s.input, props.multiline && { minHeight: 105, textAlignVertical: 'top' }, props.style]} /></View>; }
export function Chip({ text, active, onPress }: { text: string; active: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[s.chip, active && s.chipActive]}><Text style={[s.chipText, active && { color: '#fff' }]}>{text}</Text></Pressable>; }
export function Card({ children }: { children: React.ReactNode }) { return <View style={s.card}>{children}</View>; }
export function Heading({ title, subtitle }: { title: string; subtitle?: string }) { return <View style={{ gap: 5 }}><Text accessibilityRole="header" style={s.title}>{title}</Text>{subtitle && <Text style={s.muted}>{subtitle}</Text>}</View>; }
export function Empty({ icon = 'paw-outline', title, detail }: { icon?: string; title: string; detail: string }) { return <View style={s.empty}><Icon name={icon} size={46} /><Text style={s.h3}>{title}</Text><Text style={[s.muted, { textAlign: 'center' }]}>{detail}</Text></View>; }
export function CatArt({ size = 160 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityLabel="ภาพวาดแมวสีส้ม">
    <Circle cx="100" cy="100" r="94" fill="#FFE1BD" />
    <Ellipse cx="102" cy="166" rx="62" ry="9" fill="#F4C69B" />
    <Path d="M139 140 C191 148 188 96 173 100 C160 104 178 124 144 124" stroke="#D96A30" strokeWidth="15" fill="none" strokeLinecap="round" />
    <Path d="M68 111 Q45 167 76 169 L133 169 Q153 144 132 111" fill="#E78543" />
    <Path d="M58 76 L57 35 L86 54 Q103 49 120 55 L147 35 L146 85 Q150 119 102 125 Q54 122 58 76" fill="#F09A54" />
    <Path d="M65 61 L64 47 L79 57 M129 57 L141 47 L139 65" fill="#F9C29A" />
    <Path d="M78 84 Q84 76 90 84 M116 84 Q123 76 129 84" stroke="#593326" strokeWidth="4" fill="none" strokeLinecap="round" />
    <Path d="M98 93 L108 93 L103 99 Z" fill="#A65A46" />
    <Path d="M103 99 Q96 107 92 101 M103 99 Q110 107 114 101" stroke="#593326" strokeWidth="2.5" fill="none" />
    <Path d="M51 90 L74 94 M50 101 L73 101 M134 94 L158 90 M134 102 L158 103" stroke="#B76538" strokeWidth="2" strokeLinecap="round" />
    <Path d="M93 57 L96 69 M106 55 L106 66 M118 58 L115 70" stroke="#CE733D" strokeWidth="4" strokeLinecap="round" />
    <Ellipse cx="104" cy="146" rx="19" ry="22" fill="#FFE3BC" />
  </Svg>;
}
export function Ring({ percent }: { percent: number | null }) { const radius = 63; const length = 2 * Math.PI * radius; return <View style={{ width: 160, height: 160, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}><Svg width={160} height={160} style={StyleSheet.absoluteFill}><Circle cx="80" cy="80" r={radius} stroke="#FAE1D1" strokeWidth="15" fill="none" /><Circle cx="80" cy="80" r={radius} stroke={colors.orange} strokeWidth="15" fill="none" strokeDasharray={`${length * (percent ?? 0) / 100} ${length}`} strokeLinecap="round" transform="rotate(-90 80 80)" /></Svg><Text style={{ fontSize: 32, fontWeight: '800', color: colors.orange }}>{percent === null ? '—' : `${percent}%`}</Text><Text style={[s.muted, { fontSize: 11 }]}>บันทึกระดับต่ำ</Text></View>; }
export const s = StyleSheet.create({
  headerIcon: { width: 36, height: 40, borderRadius: 20, backgroundColor: '#F4ECE5', alignItems: 'center', justifyContent: 'center' },
  page: { flex: 1, backgroundColor: colors.cream }, content: { padding: 22, gap: 24, paddingBottom: 36 },
  title: { fontSize: 25, lineHeight: 36, fontWeight: '800', color: colors.dark }, h3: { fontSize: 17, lineHeight: 26, fontWeight: '700', color: colors.dark }, text: { fontSize: 15, lineHeight: 25, color: colors.dark }, muted: { fontSize: 13, lineHeight: 22, color: colors.muted }, label: { fontSize: 13, fontWeight: '600', color: colors.dark },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F5E9E0', gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { backgroundColor: '#fff', color: colors.dark, borderWidth: 1, borderColor: colors.line, borderRadius: 13, minHeight: 50, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  button: { backgroundColor: colors.orange, borderRadius: 26, minHeight: 52, paddingVertical: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondary: { backgroundColor: colors.pale, borderColor: '#F2C3A6', borderWidth: 1 }, buttonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  chip: { minHeight: 40, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line }, chipActive: { backgroundColor: colors.orange, borderColor: colors.orange }, chipText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  empty: { padding: 25, alignItems: 'center', gap: 10 }, divider: { height: 1, backgroundColor: colors.line },
  tag: { color: colors.orange, backgroundColor: colors.pale, fontSize: 11, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7, alignSelf: 'flex-start', overflow: 'hidden' },
  error: { color: colors.red, backgroundColor: '#FDECEA', padding: 12, borderRadius: 10, fontSize: 13, lineHeight: 22 },
});

