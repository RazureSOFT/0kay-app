import { apiUrl, authHeaders } from './http';

export interface SSEEvent {
  event: string;
  data: any;
}

export interface StreamOptions {
  path: string;
  body?: any;
  method?: string;
  onEvent: (ev: SSEEvent) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
  signal?: { aborted: boolean };
}

/**
 * POST a JSON body and consume an `text/event-stream` response using XHR.
 * React Native's XMLHttpRequest exposes incremental `responseText` through
 * `onprogress`, which is the most portable way to read SSE with headers.
 */
export function streamSSE(opts: StreamOptions): { abort: () => void } {
  const xhr = new XMLHttpRequest();
  let aborted = false;

  let seen = 0;
  let buffer = '';

  const abort = () => {
    aborted = true;
    if (opts.signal) opts.signal.aborted = true;
    try {
      xhr.abort();
    } catch {}
  };

  const dispatch = () => {
    const text = xhr.responseText || '';
    if (text.length <= seen) return;
    buffer += text.slice(seen);
    seen = text.length;
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      let event = 'message';
      const dataLines: string[] = [];
      for (const line of raw.split(/\r?\n/)) {
        if (line.startsWith(':')) continue;
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
      }
      if (!dataLines.length) continue;
      const dataStr = dataLines.join('\n');
      let data: any = dataStr;
      try {
        data = JSON.parse(dataStr);
      } catch {}
      try {
        opts.onEvent({ event, data });
      } catch (e) {
        opts.onError?.(e as Error);
      }
    }
  };

  xhr.open(opts.method || 'POST', apiUrl(opts.path), true);
  const headers = authHeaders({ 'Content-Type': 'application/json', Accept: 'text/event-stream' });
  for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);

  xhr.onprogress = () => dispatch();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      dispatch();
      if (aborted) return;
      if (xhr.status >= 400) {
        opts.onError?.(new Error(`HTTP ${xhr.status}`));
      } else {
        opts.onDone?.();
      }
    }
  };
  xhr.onerror = () => {
    if (aborted) return;
    opts.onError?.(new Error('网络错误'));
  };
  xhr.ontimeout = () => opts.onError?.(new Error('请求超时'));

  try {
    xhr.send(opts.body ? JSON.stringify(opts.body) : undefined);
  } catch (e) {
    opts.onError?.(e as Error);
  }

  return { abort };
}
