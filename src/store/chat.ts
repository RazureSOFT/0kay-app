import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { streamSSE } from '../api/sse';
import { chat as chatApi, life as lifeApi } from '../api/endpoints';
import { PickedFile } from '../api/http';
import type { ChatMessage, Emotion } from '../api/types';

const SESSION_KEY = 'okay.chat.session';
const UID_KEY = 'okay.uid';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface Persona {
  name: string;
  avatar: string;
  birthDate: string;
  description: string;
  personality: string;
  greeting: string;
  customPrompt: string;
}

export const EMPTY_PERSONA: Persona = {
  name: '',
  avatar: '',
  birthDate: '',
  description: '',
  personality: '',
  greeting: '',
  customPrompt: '',
};

interface ChatState {
  sessionId: string;
  messages: ChatMessage[];
  isTyping: boolean;
  voiceEnabled: boolean;
  persona: Persona;
  lastUsage: any;
  contextSummary: string;
  unread: number;
  currentTaskId: string;
  init: () => Promise<void>;
  setPersona: (p: Partial<Persona>) => void;
  setVoice: (v: boolean) => void;
  send: (content: string, attachments?: PickedFile[]) => Promise<void>;
  stop: () => void;
  clear: () => void;
  compact: () => Promise<void>;
  markRead: () => void;
  pushAssistant: (m: Partial<ChatMessage>) => void;
}

let activeStream: { abort: () => void } | null = null;

export const useChat = create<ChatState>((set, get) => ({
  sessionId: 'webui:default',
  messages: [],
  isTyping: false,
  voiceEnabled: false,
  persona: EMPTY_PERSONA,
  lastUsage: null,
  contextSummary: '',
  unread: 0,
  currentTaskId: '',

  init: async () => {
    let sid = await AsyncStorage.getItem(SESSION_KEY);
    if (!sid) {
      let u = await AsyncStorage.getItem(UID_KEY);
      if (!u) {
        u = uid();
        await AsyncStorage.setItem(UID_KEY, u);
      }
      sid = `webui:${u}`;
      await AsyncStorage.setItem(SESSION_KEY, sid);
    }
    set({ sessionId: sid });
  },

  setPersona: (p) => set((s) => ({ persona: { ...s.persona, ...p } })),
  setVoice: (v) => set({ voiceEnabled: v }),

  send: async (content, attachments = []) => {
    if (get().isTyping) return;
    const uploaded: any[] = [];
    for (const f of attachments) {
      try {
        const r = await chatApi.uploadFile(f);
        uploaded.push({ name: r.name || f.name, url: r.url, mime: r.mime || f.mime, size: r.size });
      } catch {
        // skip failed upload
      }
    }

    const requestId = `req_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: `u_${requestId}`,
      role: 'user',
      content,
      files: uploaded.map((a) => ({ name: a.name, url: a.url })),
      createdAt: Date.now(),
    };
    const assistant: ChatMessage = {
      id: requestId,
      role: 'assistant',
      content: '',
      requestId,
      streaming: true,
      createdAt: Date.now(),
    };
    const history = [...get().messages, userMsg]
      .filter((m) => m.role !== 'system')
      .slice(-20)
      .map((m) => ({
        role: m.role,
        content:
          m.content +
          (m.files?.length ? '\n' + m.files.map((f) => `[file: ${f.name} ${f.url}]`).join('\n') : ''),
      }));

    set((s) => ({ messages: [...s.messages, userMsg, assistant], isTyping: true, currentTaskId: '' }));

    const patch = (fields: Partial<ChatMessage>) =>
      set((s) => ({
        messages: s.messages.map((m) => (m.requestId === requestId ? { ...m, ...fields } : m)),
      }));

    const finish = () => {
      patch({ streaming: false });
      set({ isTyping: false });
      activeStream = null;
    };

    const stream = streamSSE({
      path: '/api/life/chat',
      body: {
        request_id: requestId,
        prompt: content,
        stream: true,
        session_id: get().sessionId,
        user_id: 'webui',
        persona: get().persona,
        attachments: uploaded,
        history,
      },
      onEvent: ({ event, data }) => {
        if (event === 'chunk') {
          const chunk = data?.chunk ?? '';
          const current = get().messages.find((m) => m.requestId === requestId);
          patch({
            content: (current?.content || '') + chunk,
            taskId: data?.task_id || current?.taskId,
            emotion: data?.emotion || current?.emotion,
            mentalEnergy: data?.mental_energy ?? current?.mentalEnergy,
            thinkSummary: data?.think_summary || current?.thinkSummary,
          });
          set({ currentTaskId: data?.task_id || get().currentTaskId });
        } else if (event === 'done') {
          const current = get().messages.find((m) => m.requestId === requestId);
          patch({
            streaming: false,
            emotion: data?.emotion || current?.emotion,
            mentalEnergy: data?.mental_energy ?? current?.mentalEnergy,
          });
          finish();
        } else if (event === 'error') {
          const current = get().messages.find((m) => m.requestId === requestId);
          patch({ content: current?.content || `⚠ ${data?.error || data?.message || '出错'}`, error: String(data?.error || data?.message || '') });
          finish();
        }
      },
      onError: (err) => {
        const current = get().messages.find((m) => m.requestId === requestId);
        if (!current?.content) patch({ content: `⚠ ${err.message}` });
        patch({ error: err.message });
        finish();
      },
      onDone: () => finish(),
    });
    activeStream = stream;
  },

  stop: () => {
    activeStream?.abort();
    activeStream = null;
    set((s) => ({
      isTyping: false,
      messages: s.messages.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    }));
  },

  clear: () => {
    activeStream?.abort();
    activeStream = null;
    set({ messages: [], isTyping: false, currentTaskId: '' });
  },

  compact: async () => {
    const { messages, sessionId, persona } = get();
    const history = messages.slice(-40).map((m) => ({ role: m.role, content: m.content }));
    const res = await lifeApi.compact({ session_id: sessionId, history, persona });
    if (res?.summary) {
      const sysMsg: ChatMessage = { id: 'summary', role: 'system', content: `已压缩上下文：${res.summary}` };
      set((s) => ({ contextSummary: res.summary, messages: [sysMsg, ...s.messages].slice(-60) }));
    }
  },

  markRead: () => set({ unread: 0 }),
  pushAssistant: (m) =>
    set((s) => {
      const msg = { id: `n_${Date.now()}`, role: 'assistant', content: '', createdAt: Date.now(), ...m } as ChatMessage;
      return { messages: [...s.messages, msg], unread: s.unread + 1 };
    }),
}));

export type { Emotion };
