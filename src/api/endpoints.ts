import { apiBlob, apiDelete, apiGet, apiJson, apiPatch, apiPost, apiPut, apiUpload, PickedFile } from './http';
import type {
  AgentRow,
  ApprovalRow,
  Health,
  LifeNotification,
  MemoryRow,
  PlatformState,
  PluginRow,
  Provider,
  QuestionRow,
  SessionInfo,
  SettingsSection,
  TaskRow,
  Usage,
} from './types';

const q = (obj: Record<string, any>): string => {
  const parts = Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? '?' + parts.join('&') : '';
};

export const auth = {
  session: () => apiGet<SessionInfo>('/api/auth/session'),
  login: (token: string) => apiPost<SessionInfo>('/api/auth/session', { token }),
  loginPin: (pin: string) => apiPost<SessionInfo>('/api/auth/session', { pin }),
  logout: () => apiDelete<SessionInfo>('/api/auth/session'),
  pinStatus: () => apiGet<any>('/api/security/pin'),
  setPin: (pin: string) => apiPost<any>('/api/security/pin', { pin }),
  clearPin: () => apiDelete<any>('/api/security/pin'),
};

export const system = {
  health: () => apiGet<Health>('/health'),
};

export const life = {
  state: async (): Promise<PlatformState> => {
    try {
      return await apiGet<PlatformState>('/api/state');
    } catch {
      return await apiGet<PlatformState>('/api/life/state');
    }
  },
  permissions: () => apiGet<Record<string, boolean>>('/api/life/permissions'),
  setPermissions: (v: Record<string, boolean>) => apiPost<Record<string, boolean>>('/api/life/permissions', v),
  memories: (limit = 50, query = '') =>
    apiGet<{ memories?: MemoryRow[]; stats?: any }>(`/api/life/memories${q({ limit, query })}`),
  notifications: (sessionId: string) =>
    apiGet<{ notifications: LifeNotification[] }>(`/api/life/notifications${q({ session_id: sessionId })}`),
  ackNotifications: (sessionId: string, ids: string[]) =>
    apiPost<any>('/api/life/notifications', { session_id: sessionId, ids }),
  companion: () => apiGet<any>('/api/life/companion'),
  companionAction: (action: string, payload: any = {}) => apiPost<any>('/api/life/companion', { action, payload }),
  compact: (body: { session_id: string; history: any[]; persona?: any }) => apiPost<{ summary: string }>('/api/life/compact', body),
};

export const chat = {
  tts: (text: string, voice?: string) => apiBlob('/api/tts', { text, voice }),
  uploadImage: (file: PickedFile) => apiUpload<{ file: string; url: string }>('/api/images', file),
  uploadFile: (file: PickedFile) =>
    apiUpload<{ file: string; url: string; name: string; size: number; mime: string }>('/api/files', file),
};

export const providers = {
  list: () => apiGet<{ providers?: Provider[]; default_provider_id?: string; default_model?: string }>('/api/providers'),
  upsert: (provider: Provider) => apiPost<any>('/api/providers', { provider }),
  replaceAll: (body: { providers: Provider[]; default_provider_id?: string; default_model?: string }) =>
    apiPut<any>('/api/providers', body),
  remove: (id: string) => apiDelete<any>(`/api/providers/${encodeURIComponent(id)}`),
  defaults: () => apiGet<{ default_provider_id?: string; default_model?: string }>('/api/providers/defaults'),
  setDefaults: (body: { default_provider_id?: string; default_model?: string }) =>
    apiPost<any>('/api/providers/defaults', body),
  fetchModels: (body: { id?: string; provider: string; base_url?: string; api_key?: string; format?: string }) =>
    apiPost<{ models: any[]; source: string; error?: string }>('/api/models/fetch', body),
  models: () => apiGet<{ models: any[]; all_model_ids?: string[]; default_provider_id?: string; default_model?: string }>('/api/models'),
};

export const settings = {
  sections: (values = true) =>
    apiGet<{ sections: SettingsSection[] }>(`/api/settings/sections${values ? '?values=1' : ''}`),
  get: (id: string) => apiGet<{ section: SettingsSection; values: Record<string, any> }>(`/api/settings/${encodeURIComponent(id)}`),
  save: (id: string, values: Record<string, any>) =>
    apiPost<{ section: SettingsSection; values: Record<string, any> }>(`/api/settings/${encodeURIComponent(id)}`, values),
  test: (id: string) => apiBlob(`/api/settings/${encodeURIComponent(id)}/test`, {}),
};

export const plugins = {
  list: () => apiGet<PluginRow[]>('/api/plugins'),
  setEnabled: (name: string, enabled: boolean) => apiPatch<any>(`/api/plugins/${encodeURIComponent(name)}`, { enabled }),
  installed: () => apiGet<{ installed?: any[]; packages?: any[] }>('/api/plugins/installed'),
  capabilities: () => apiGet<any>('/api/plugins/capabilities'),
  pmInstalled: () => apiGet<{ installed?: any[]; packages?: any[] }>('/api/plugins/pm/installed'),
  pmUninstall: (pkg: string) => apiPost<any>('/api/plugins/pm/uninstall', { package: pkg }),
  pmStatus: () => apiGet<any>('/api/plugins/pm/status'),
  pmCheck: () => apiGet<any>('/api/update/check'),
  pmCheckPlugins: () => apiGet<any>('/api/update/check-plugins'),
  pmUpdate: (plugin: string, version?: string) => apiPost<any>('/api/update/apply', { plugin, version }),
  updateStatus: () => apiGet<any>('/api/update/status'),
};

export const usage = {
  get: () => apiGet<Usage>('/api/usage'),
  clear: () => apiDelete<{ ok: boolean; usage: Usage }>('/api/usage'),
};

export const agents = {
  list: () => apiGet<{ agents?: AgentRow[]; online_count?: number }>('/api/agents'),
  sessions: () => apiGet<{ sessions?: TaskRow[] }>('/api/agent/sessions'),
  createSession: (title: string) => apiPost<{ session_id: string }>('/api/agent/sessions', { title }),
  updateSession: (id: string, body: { action: string; title?: string }) =>
    apiPatch<any>(`/api/agent/sessions/${encodeURIComponent(id)}`, body),
  deleteSession: (id: string) => apiDelete<any>(`/api/agent/sessions/${encodeURIComponent(id)}`),
  searchSessions: (text: string, limit = 20) =>
    apiGet<{ matches: { session_id: string; title: string; snippet: string }[] }>(
      `/api/agent/sessions/search${q({ q: text, limit })}`,
    ),
  forkSession: (sessionId: string) => apiPost<{ session_id: string }>('/api/agent/sessions/fork', { session_id: sessionId }),
  turns: (id: string, limit = 50, before?: string) =>
    apiGet<{ tasks?: TaskRow[]; more?: boolean; next?: string }>(
      `/api/agent/sessions/${encodeURIComponent(id)}/turns${q({ limit, before })}`,
    ),
  send: (body: Record<string, any>) => apiPost<{ task_id: string; accepted: boolean; message?: string }>('/api/agent/messages', body),
  tasks: () => apiGet<{ tasks?: TaskRow[] }>('/api/tasks'),
  cancelTask: (taskId: string) => apiPost<{ success: boolean; message?: string }>(`/api/tasks/${encodeURIComponent(taskId)}/cancel`, {}),
  inbox: (sessionId?: string) =>
    apiGet<{ approvals: ApprovalRow[]; questions: QuestionRow[] }>(`/api/agent/inbox${q({ session_id: sessionId })}`),
  approval: (body: { executor_id?: string; id: string; allow: boolean }) => apiPost<any>('/api/agent/approvals', body),
  answer: (body: { executor_id?: string; id: string; answer: string }) => apiPost<any>('/api/agent/questions', body),
  workspace: (executorId?: string, path?: string) =>
    apiGet<any>(`/api/agent/workspace${q({ executor_id: executorId, path })}`),
  tree: (executorId?: string, path?: string) => apiGet<any>(`/api/agent/tree${q({ executor_id: executorId, path })}`),
  readFile: (executorId: string | undefined, path: string, offset = 0, limit = 2000) =>
    apiGet<any>(`/api/agent/file${q({ executor_id: executorId, path, offset, limit })}`),
  writeFile: (body: { executor_id?: string; path: string; content: string }) => apiPost<any>('/api/agent/file', body),
  exec: (body: { executor_id?: string; command: string; cwd?: string; timeout?: number }) => apiPost<any>('/api/agent/exec', body),
  browser: (executorId?: string) => apiGet<any>(`/api/agent/browser${q({ executor_id: executorId })}`),
  browserAction: (body: Record<string, any>) => apiPost<any>('/api/agent/browser/action', body),
  compact: (body: { session_id: string; model_id?: string }) => apiPost<any>('/api/agent/compact', body),
  context: (sessionId: string, modelId?: string) =>
    apiGet<any>(`/api/agent/context${q({ session_id: sessionId, model_id: modelId })}`),
  host: (executorId?: string) => apiGet<any>(`/api/agent/host${q({ executor_id: executorId })}`),
  workspaces: () => apiGet<{ workspaces?: any[] }>('/api/agent/workspaces'),
};

export const skills = {
  list: () => apiGet<{ success?: boolean; result?: { dir?: string; skills?: any[] }; error?: string }>('/api/skills'),
  save: (name: string, content: string) => apiPost<any>('/api/skills', { name, content }),
  remove: (name: string) => apiDelete<any>(`/api/skills/${encodeURIComponent(name)}`),
};

export const live2d = {
  list: () => apiGet<{ id: string; label: string; url: string }[]>('/api/live2d'),
  remove: (id: string) => apiDelete<any>(`/api/live2d/${id}`),
};

export const pairing = {
  request: (name: string) => apiPost<{ id: string; code: string; secret: string; expires: string }>('/api/pairing/request', { name }),
  status: (id: string, secret: string) =>
    apiPost<{ approved: boolean; core_id?: string; token?: string; certificate?: string; server_name?: string }>(
      '/api/pairing/status',
      { id, secret },
    ),
  pending: () => apiGet<{ requests: any[] }>('/api/pairing/pending'),
  approve: (id: string, code: string, allow: boolean) => apiPost<any>('/api/pairing/approve', { id, code, allow }),
};

export const search = {
  query: (text: string, n = 10, engine?: string) =>
    apiPost<any>('/api/search', { query: text, n, engine }),
};

export const ui = {
  patches: () => apiGet<any>('/api/ui/patches'),
  reload: () => apiPost<any>('/api/ui/patches', {}),
};

export { apiGet, apiPost, apiPut, apiPatch, apiDelete };
