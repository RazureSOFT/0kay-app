import { create } from 'zustand';
import { life as lifeApi } from '../api/endpoints';
import type { Emotion, PlatformState } from '../api/types';
import { useChat } from './chat';

interface LifeState {
  state: PlatformState;
  isConnected: boolean;
  lastFetchedAt: number;
  notifications: { id: string; text: string; created_at?: string }[];
  timer?: any;
  notifyTimer?: any;
  connect: () => void;
  disconnect: () => void;
  refresh: () => Promise<void>;
  loadNotifications: (sessionId?: string) => Promise<void>;
  ack: (ids: string[]) => Promise<void>;
}

const EMPTY: PlatformState = {
  emotion: { valence: 0, arousal: 0.5, connection: 0.5, irritation: 0 },
  mentalEnergy: 100,
  isSleeping: false,
  activeTasks: [],
  onlineAgents: 0,
  totalAgents: 0,
  pluginCount: 0,
  healthyPlugins: 0,
};

export const useLife = create<LifeState>((set, get) => ({
  state: EMPTY,
  isConnected: false,
  lastFetchedAt: 0,
  notifications: [],

  refresh: async () => {
    try {
      const s = await lifeApi.state();
      set({ state: { ...get().state, ...s }, isConnected: true, lastFetchedAt: Date.now() });
    } catch {
      set({ isConnected: false });
    }
  },

  connect: () => {
    if (get().timer) return;
    get().refresh();
    const t = setInterval(() => get().refresh(), 5000);
    set({ timer: t });
    get().loadNotifications();
    const n = setInterval(() => {
      const sid = useChat.getState().sessionId;
      get().loadNotifications(sid);
    }, 4000);
    set({ notifyTimer: n });
  },

  disconnect: () => {
    const { timer, notifyTimer } = get();
    if (timer) clearInterval(timer);
    if (notifyTimer) clearInterval(notifyTimer);
    set({ timer: undefined, notifyTimer: undefined, isConnected: false });
  },

  loadNotifications: async (sessionId) => {
    try {
      const res = await lifeApi.notifications(sessionId || useChat.getState().sessionId);
      const incoming = (res.notifications || []).filter((n) => !get().notifications.some((x) => x.id === n.id));
      if (incoming.length) {
        set((s) => ({ notifications: [...incoming, ...s.notifications].slice(0, 100) }));
        for (const n of incoming) {
          useChat.getState().pushAssistant({ content: n.text, id: `life_${n.id}` });
        }
      }
    } catch {
      // offline
    }
  },

  ack: async (ids) => {
    try {
      await lifeApi.ackNotifications(useChat.getState().sessionId, ids);
      set((s) => ({ notifications: s.notifications.filter((n) => !ids.includes(n.id)) }));
    } catch {}
  },
}));

export function emotionMood(e?: Emotion, sleeping?: boolean): { label: string; color: string } {
  if (sleeping) return { label: '睡眠中', color: '#7f8fa6' };
  if (!e) return { label: '平静', color: '#8a8f98' };
  if (e.irritation > 0.7) return { label: '烦躁', color: '#d13438' };
  if (e.valence > 0.5) return { label: '开心', color: '#107c10' };
  if (e.valence < -0.3) return { label: '低落', color: '#0078d4' };
  return { label: '平静', color: '#8a8f98' };
}
