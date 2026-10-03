import { create } from 'zustand';
import { settings as settingsApi } from '../api/endpoints';
import type { SettingsSection } from '../api/types';

interface SettingsState {
  sections: SettingsSection[];
  loading: boolean;
  error: string;
  load: () => Promise<void>;
  save: (id: string, values: Record<string, any>) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  sections: [],
  loading: false,
  error: '',

  load: async () => {
    set({ loading: true });
    try {
      const res = await settingsApi.sections(true);
      set({ sections: res.sections || [], loading: false, error: '' });
    } catch (e: any) {
      set({ loading: false, error: e.message });
    }
  },

  save: async (id, values) => {
    const res = await settingsApi.save(id, values);
    set((s) => ({
      sections: s.sections.map((sec) => (sec.id === id ? { ...sec, ...(res.section || {}), values: res.values } : sec)),
    }));
  },
}));
