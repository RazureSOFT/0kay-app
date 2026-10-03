import { create } from 'zustand';
import { providers as providersApi } from '../api/endpoints';
import type { Provider } from '../api/types';

interface ProvidersState {
  providers: Provider[];
  defaultProviderId: string;
  defaultModel: string;
  allModelIds: string[];
  loading: boolean;
  error: string;
  load: () => Promise<void>;
  upsert: (p: Provider) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setDefaults: (body: { default_provider_id?: string; default_model?: string }) => Promise<void>;
  loadModels: () => Promise<void>;
}

export const useProviders = create<ProvidersState>((set, get) => ({
  providers: [],
  defaultProviderId: '',
  defaultModel: '',
  allModelIds: [],
  loading: false,
  error: '',

  load: async () => {
    set({ loading: true });
    try {
      const res = await providersApi.list();
      set({
        providers: res.providers || [],
        defaultProviderId: res.default_provider_id || '',
        defaultModel: res.default_model || '',
        loading: false,
        error: '',
      });
    } catch (e: any) {
      set({ loading: false, error: e.message });
    }
  },

  upsert: async (p) => {
    await providersApi.upsert(p);
    await get().load();
  },

  remove: async (id) => {
    await providersApi.remove(id);
    await get().load();
  },

  setDefaults: async (body) => {
    await providersApi.setDefaults(body);
    await get().load();
  },

  loadModels: async () => {
    try {
      const res = await providersApi.models();
      set({ allModelIds: res.all_model_ids || (res.models || []).map((m: any) => m.id || m) });
    } catch {}
  },
}));
