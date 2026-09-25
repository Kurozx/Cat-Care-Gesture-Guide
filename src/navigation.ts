import type { Cat, DailyLog, Guide, Vaccine } from './types';
export type Route = { name: 'welcome' | 'care' | 'auth' | 'guides' | 'status' | 'history' | 'account' | 'cats' | 'family' | 'profile' | 'vaccines' | 'admin' } | { name: 'guide'; guide: Guide } | { name: 'log'; log?: DailyLog } | { name: 'cat'; cat?: Cat } | { name: 'vaccine'; vaccine?: Vaccine };
export interface ScreenProps { navigate: (route: Route) => void; back: () => void }
