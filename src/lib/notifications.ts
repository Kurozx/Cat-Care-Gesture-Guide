import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type { Vaccine } from '../types';

// Importing expo-notifications also registers push listeners. Avoid that side
// effect in Android Expo Go, including cleanup during initial session loading.
const androidExpoGo = () => Platform.OS === 'android' && isRunningInExpoGo();

export async function clearReminders() {
  if (Platform.OS === 'web' || androidExpoGo()) return;
  const N = await import('expo-notifications');
  await N.cancelAllScheduledNotificationsAsync();
}
export async function syncReminders(vaccines: Vaccine[]) {
  if (Platform.OS === 'web') throw new Error('การแจ้งเตือนบนอุปกรณ์ใช้ได้ในแอป Android/iOS');
  if (androidExpoGo()) throw new Error('โหมด Expo Go บน Android ยังไม่เปิดการเตือนนัดหมายของแอปนี้ กรุณาใช้แอปที่ติดตั้งด้วย npm run android เพื่อทดสอบการแจ้งเตือน');
  const N = await import('expo-notifications');
  if (Platform.OS === 'android') await N.setNotificationChannelAsync('care', { name: 'นัดหมายดูแลแมว', importance: N.AndroidImportance.DEFAULT });
  const permission = await N.requestPermissionsAsync();
  if (!permission.granted) throw new Error('ยังไม่ได้อนุญาตการแจ้งเตือน เปิดสิทธิ์ได้ในตั้งค่าอุปกรณ์');
  N.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) });
  await N.cancelAllScheduledNotificationsAsync();
  for (const v of vaccines.filter(v => v.due_at && Date.parse(v.due_at) > Date.now()).sort((a,b) => a.due_at!.localeCompare(b.due_at!)).slice(0, 50)) {
    await N.scheduleNotificationAsync({ identifier: `catcare-${v.id}`, content: { title: 'ถึงเวลานัดหมายดูแลแมว', body: v.name, data: { cat_id: v.cat_id } }, trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: new Date(v.due_at!), channelId: 'care' } });
  }
}
