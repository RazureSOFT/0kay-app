import { useServer } from '../store/server';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = useServer.getState().baseUrl.replace(/\/+$/, '');
  return base + (path.startsWith('/') ? path : '/' + path);
}

/** Absolute URL for a Core-relative asset path such as `/api/images?file=x`. */
export function assetUrl(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return apiUrl(path);
}

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const { token, pin } = useServer.getState();
  const headers: Record<string, string> = { Accept: 'application/json', ...(extra || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (pin) headers['X-0kay-Pin'] = pin;
  return headers;
}

async function parse(res: Response): Promise<any> {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Low-level request. Adds bearer + PIN, surfaces 401/403 pin gates to the
 * server store, and normalizes the `{error, code}` envelope into ApiError.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = authHeaders(init.headers as Record<string, string> | undefined);
  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...init, headers });
  } catch (e: any) {
    throw new ApiError(e?.message || '无法连接服务器', 0, 'network');
  }
  if (res.status === 401) useServer.getState().markAuthRequired(true);
  return res;
}

export async function apiJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = authHeaders({
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  });
  const res = await apiFetch(path, { ...init, headers });
  const data = await parse(res);
  if (!res.ok) {
    const code = data && typeof data === 'object' ? data.code : undefined;
    const msg =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      (typeof data === 'string' && data) ||
      `HTTP ${res.status}`;
    if (res.status === 403 && code === 'pin_required') useServer.getState().markPinRequired(true);
    throw new ApiError(String(msg), res.status, code);
  }
  return data as T;
}

export const apiGet = <T = any>(path: string) => apiJson<T>(path, { method: 'GET' });
export const apiPost = <T = any>(path: string, body?: any) =>
  apiJson<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export const apiPut = <T = any>(path: string, body?: any) =>
  apiJson<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) });
export const apiPatch = <T = any>(path: string, body?: any) =>
  apiJson<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) });
export const apiDelete = <T = any>(path: string, body?: any) =>
  apiJson<T>(path, { method: 'DELETE', body: body === undefined ? undefined : JSON.stringify(body) });

export interface PickedFile {
  uri: string;
  name: string;
  mime: string;
}

/** multipart/form-data upload. Field defaults to `file` (images/files/live2d). */
export async function apiUpload<T = any>(
  path: string,
  file: PickedFile,
  field = 'file',
  extra?: Record<string, string>,
): Promise<T> {
  const form = new FormData();
  form.append(field, { uri: file.uri, name: file.name, type: file.mime } as any);
  if (extra) for (const [k, v] of Object.entries(extra)) form.append(k, v);
  const headers = authHeaders();
  const res = await apiFetch(path, { method: 'POST', body: form, headers });
  const data = await parse(res);
  if (!res.ok) {
    const msg = (data && typeof data === 'object' && data.error) || `HTTP ${res.status}`;
    throw new ApiError(String(msg), res.status, data?.code);
  }
  return data as T;
}

/** POST returning raw bytes (TTS audio, converted files). */
export async function apiBlob(path: string, body?: any): Promise<{ blob: Blob; mime: string }> {
  const headers = authHeaders(body ? { 'Content-Type': 'application/json' } : undefined);
  const res = await apiFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new ApiError(msg, res.status);
  }
  const blob = await res.blob();
  return { blob, mime: res.headers.get('Content-Type') || 'application/octet-stream' };
}
