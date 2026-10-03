export interface PairingInfo {
  baseUrl: string;
  token?: string;
  pin?: string;
  coreId?: string;
  name?: string;
}

function parseQuery(query: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of query.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    const rawKey = eq < 0 ? part : part.slice(0, eq);
    const rawVal = eq < 0 ? '' : part.slice(eq + 1);
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    out[key] = decodeURIComponent(rawVal.replace(/\+/g, ' '));
  }
  return out;
}

/**
 * Parse a scanned pairing payload. Accepts:
 *   - 0kay://pair?url=...&token=...&pin=...&core_id=...&name=...
 *   - JSON: {"url": "...", "token": "...", ...}
 *   - a bare http(s) URL
 */
export function parsePairingPayload(raw: string): PairingInfo | null {
  const text = (raw || '').trim();
  if (!text) return null;

  const uri = /^0kay:\/\/(?:pair)?\?(.+)$/i.exec(text);
  if (uri) {
    const q = parseQuery(uri[1]);
    if (!q.url) return null;
    return {
      baseUrl: q.url,
      token: q.token || undefined,
      pin: q.pin || undefined,
      coreId: q.core_id || q.coreId || undefined,
      name: q.name || undefined,
    };
  }

  if (text.startsWith('{')) {
    try {
      const j = JSON.parse(text);
      const url = j.url || j.baseUrl;
      if (url) {
        return {
          baseUrl: String(url),
          token: j.token ? String(j.token) : undefined,
          pin: j.pin ? String(j.pin) : undefined,
          coreId: j.core_id || j.coreId ? String(j.core_id || j.coreId) : undefined,
          name: j.name ? String(j.name) : undefined,
        };
      }
    } catch {
      /* not JSON */
    }
  }

  if (/^https?:\/\//i.test(text)) return { baseUrl: text };
  return null;
}
