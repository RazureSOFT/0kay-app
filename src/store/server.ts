import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'okay.token';
const PIN_KEY = 'okay.pin';
const URL_KEY = 'okay.baseUrl';

export interface ServerState {
  ready: boolean;
  baseUrl: string;
  token: string;
  pin: string;
  coreId: string;
  lanEnabled: boolean;
  requiresAuth: boolean;
  authRequired: boolean;
  pinRequired: boolean;
  hydrate: () => Promise<void>;
  configure: (v: { baseUrl: string; token?: string; pin?: string }) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  clearPin: () => Promise<void>;
  disconnect: () => Promise<void>;
  markAuthRequired: (v: boolean) => void;
  markPinRequired: (v: boolean) => void;
}

export const useServer = create<ServerState>((set) => ({
  ready: false,
  baseUrl: '',
  token: '',
  pin: '',
  coreId: '',
  lanEnabled: false,
  requiresAuth: true,
  authRequired: false,
  pinRequired: false,

  hydrate: async () => {
    const [url, token, pin] = await Promise.all([
      AsyncStorage.getItem(URL_KEY),
      SecureStore.getItemAsync(TOKEN_KEY).catch(() => null),
      SecureStore.getItemAsync(PIN_KEY).catch(() => null),
    ]);
    set({ baseUrl: url || '', token: token || '', pin: pin || '', ready: true });
  },

  configure: async ({ baseUrl, token, pin }) => {
    const cleanUrl = normalizeBase(baseUrl);
    set({ baseUrl: cleanUrl, ...(token !== undefined ? { token } : {}), ...(pin !== undefined ? { pin } : {}) });
    await AsyncStorage.setItem(URL_KEY, cleanUrl);
    if (token !== undefined) {
      if (token) await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
      else await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    }
    if (pin !== undefined) {
      if (pin) await SecureStore.setItemAsync(PIN_KEY, pin).catch(() => {});
      else await SecureStore.deleteItemAsync(PIN_KEY).catch(() => {});
    }
  },

  setPin: async (pin) => {
    set({ pin, pinRequired: false });
    if (pin) await SecureStore.setItemAsync(PIN_KEY, pin).catch(() => {});
    else await SecureStore.deleteItemAsync(PIN_KEY).catch(() => {});
  },

  clearPin: async () => {
    set({ pin: '' });
    await SecureStore.deleteItemAsync(PIN_KEY).catch(() => {});
  },

  disconnect: async () => {
    set({ token: '', pin: '', authRequired: false, pinRequired: false, coreId: '', lanEnabled: false });
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(PIN_KEY).catch(() => {});
  },

  markAuthRequired: (v) => set({ authRequired: v }),
  markPinRequired: (v) => set({ pinRequired: v }),
}));

export function normalizeBase(url: string): string {
  let u = (url || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'http://' + u;
  return u.replace(/\/+$/, '');
}

export function getBaseUrl(): string {
  return useServer.getState().baseUrl;
}
