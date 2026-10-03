import { create } from 'zustand';
import { agents } from '../api/endpoints';
import type { AgentRow, TaskRow } from '../api/types';

interface TasksState {
  tasks: TaskRow[];
  sessions: TaskRow[];
  agentRows: AgentRow[];
  onlineCount: number;
  loading: boolean;
  error: string;
  loadTasks: () => Promise<void>;
  loadSessions: () => Promise<void>;
  loadAgents: () => Promise<void>;
  cancel: (taskId: string) => Promise<void>;
  createSession: (title: string) => Promise<string | null>;
  deleteSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
}

export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  sessions: [],
  agentRows: [],
  onlineCount: 0,
  loading: false,
  error: '',

  loadTasks: async () => {
    try {
      const res = await agents.tasks();
      set({ tasks: res.tasks || [], error: '' });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  loadSessions: async () => {
    set({ loading: true });
    try {
      const res = await agents.sessions();
      set({ sessions: res.sessions || [], loading: false, error: '' });
    } catch (e: any) {
      set({ loading: false, error: e.message });
    }
  },

  loadAgents: async () => {
    try {
      const res = await agents.list();
      set({ agentRows: res.agents || [], onlineCount: res.online_count || 0 });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  cancel: async (taskId) => {
    await agents.cancelTask(taskId);
    await get().loadTasks();
  },

  createSession: async (title) => {
    try {
      const res = await agents.createSession(title);
      await get().loadSessions();
      return res.session_id;
    } catch (e: any) {
      set({ error: e.message });
      return null;
    }
  },

  deleteSession: async (id) => {
    await agents.deleteSession(id);
    set((s) => ({ sessions: s.sessions.filter((x) => x.session_id !== id) }));
  },

  renameSession: async (id, title) => {
    await agents.updateSession(id, { action: 'rename', title });
    await get().loadSessions();
  },
}));
