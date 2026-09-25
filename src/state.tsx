import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { configured, supabase } from './lib/supabase';
import * as repo from './data/repository';
import { guides as bundledGuides } from './data/guides';
import type { Guide, Snapshot } from './types';
import { clearReminders } from './lib/notifications';

function useStateController() {
  const [mode, setMode] = useState<repo.Mode>('guest');
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<Snapshot | null>(null);
  const [guides, setGuides] = useState<Guide[]>(bundledGuides);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [catId, setCatId] = useState('');
  const [notice, setNotice] = useState('');
  const generation = useRef(0);
  const sessionUser = useRef('');
  const modeRef = useRef(mode); modeRef.current = mode;
  const refresh = async (target: repo.Mode = mode) => {
    const ticket = ++generation.current;
    setLoading(true); setError('');
    try {
      const nextGuides = target === 'demo' || !configured ? bundledGuides : await repo.loadGuides(target);
      const nextData = target === 'guest' ? null : await repo.loadSnapshot(target);
      if (ticket !== generation.current) return;
      setGuides(nextGuides); setData(nextData);
      setCatId(current => nextData?.cats.some(c => c.id === current) ? current : nextData?.cats[0]?.id ?? '');
    } catch (e) { if (ticket === generation.current) { if (target === 'live') setData(null); setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ'); } }
    finally { if (ticket === generation.current) setLoading(false); }
  };
  useEffect(() => { void refresh(mode); }, [mode, userId]);
  useEffect(() => {
    const db = supabase;
    if (!db) return;
    const { data: listener } = db.auth.onAuthStateChange((event, session) => {
      // No asynchronous Auth calls inside this callback (avoids auth lock deadlocks).
      if (session) {
        if (modeRef.current !== 'demo' || event === 'SIGNED_IN') {
          if (sessionUser.current !== session.user.id) { ++generation.current; setData(null); sessionUser.current = session.user.id; }
          setUserId(session.user.id);
          setMode('live');
        }
      } else if (modeRef.current !== 'demo') { ++generation.current; sessionUser.current = ''; setUserId(''); setData(null); setMode('guest'); void clearReminders().catch(() => {}); }
    });
    const appListener = AppState.addEventListener('change', state => { if (state === 'active') db.auth.startAutoRefresh(); else db.auth.stopAutoRefresh(); });
    db.auth.startAutoRefresh();
    return () => { listener.subscription.unsubscribe(); appListener.remove(); db.auth.stopAutoRefresh(); };
  }, []);
  const enterDemo = () => { ++generation.current; setData(null); setMode('demo'); };
  const leave = async () => {
    if (mode === 'live') { const { error } = await supabase!.auth.signOut(); if (error) throw error; }
    ++generation.current; setData(null); setCatId(''); setMode('guest');
    await clearReminders();
  };
  return { mode, data, guides, loading, error, catId, setCatId, refresh, notice, setNotice, enterDemo, leave };
}
type AppStateType = ReturnType<typeof useStateController>;
const Context = createContext<AppStateType | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) { const state = useStateController(); return <Context.Provider value={state}>{children}</Context.Provider>; }
export function useApp() { const state = useContext(Context); if (!state) throw new Error('Missing provider'); return state; }
