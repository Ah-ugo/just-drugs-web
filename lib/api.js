// Browser API client for the Just Drugs FastAPI backend (via the /backend proxy).
import { storage } from './storage';

const BASE = '/backend';
export const KEYS = { access: 'jd_access', refresh: 'jd_refresh', guest: 'jd_guest', adminAccess: 'jd_admin_access', adminRefresh: 'jd_admin_refresh' };

// The backend has two separate auth realms: shoppers (/auth) and staff (/admin/auth).
const REALMS = {
  user: { access: KEYS.access, refresh: KEYS.refresh, refreshPath: '/auth/refresh', expiredEvent: 'jd:session-expired' },
  admin: { access: KEYS.adminAccess, refresh: KEYS.adminRefresh, refreshPath: '/admin/auth/refresh', expiredEvent: 'jd:admin-session-expired' },
};

export class ApiError extends Error {
  constructor(message, status = 0, code = 'ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
  /** FastAPI 422 -> { fieldName: "message" } */
  get fieldErrors() {
    const out = {};
    for (const e of this.details?.errors || []) {
      const key = e.loc?.[e.loc.length - 1];
      if (key !== undefined) out[key] = String(e.msg || '').replace(/^Value error,\s*/i, '');
    }
    return out;
  }
}

const qs = (params) => {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

/* ---------- tokens ---------- */
export const getTokens = () => ({ access: storage.get(KEYS.access), refresh: storage.get(KEYS.refresh) });
export function setTokens({ access_token, refresh_token }, realm = 'user') {
  const r = REALMS[realm];
  if (access_token) storage.set(r.access, access_token);
  if (refresh_token) storage.set(r.refresh, refresh_token);
}
export function clearTokens(notify = false, realm = 'user') {
  const r = REALMS[realm];
  storage.remove(r.access);
  storage.remove(r.refresh);
  if (notify && typeof window !== 'undefined') window.dispatchEvent(new Event(r.expiredEvent));
}
export const getAdminTokens = () => ({ access: storage.get(KEYS.adminAccess), refresh: storage.get(KEYS.adminRefresh) });

function jwtExpiry(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part)).exp * 1000;
  } catch { return 0; }
}

/* Refresh tokens rotate (reuse = revoked), so concurrent refreshes must share one request. */
const refreshing = {};
export function refreshSession(realm = 'user') {
  if (refreshing[realm]) return refreshing[realm];
  const r = REALMS[realm];
  const rt = storage.get(r.refresh);
  if (!rt) return Promise.resolve(false);
  refreshing[realm] = fetch(`${BASE}${r.refreshPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
  })
    .then(async (res) => {
      const j = await res.json().catch(() => null);
      if (res.ok && j?.data?.access_token) { setTokens(j.data, realm); return true; }
      if ([400, 401, 403].includes(res.status)) clearTokens(true, realm);
      return false;
    })
    .catch(() => false)
    .finally(() => { refreshing[realm] = null; });
  return refreshing[realm];
}

async function getAccessToken(realm = 'user') {
  const r = REALMS[realm];
  const token = storage.get(r.access);
  if (!token) {
    if (storage.get(r.refresh)) { await refreshSession(realm); return storage.get(r.access); }
    return null;
  }
  // Cart & checkout treat an expired token as a guest silently, so refresh BEFORE it expires.
  if (jwtExpiry(token) - Date.now() < 30000) { await refreshSession(realm); return storage.get(r.access); }
  return token;
}

/* ---------- guest session ---------- */
let guestPending = null;
export async function ensureGuestToken() {
  const existing = storage.get(KEYS.guest);
  if (existing) return existing;
  if (!guestPending) {
    guestPending = fetch(`${BASE}/auth/guest-session`, { method: 'POST' })
      .then((r) => r.json())
      .then((j) => { const g = j?.data?.guest_token; if (g) storage.set(KEYS.guest, g); return g || null; })
      .catch(() => null)
      .finally(() => { guestPending = null; });
  }
  return guestPending;
}

/* ---------- core request ---------- */
export async function request(path, opts = {}) {
  const { method = 'GET', body, form, params, auth = true, guest = true, signal, realm = 'user', _retried = false } = opts;
  const headers = { Accept: 'application/json' };

  if (auth) { const t = await getAccessToken(realm); if (t) headers.Authorization = `Bearer ${t}`; }
  if (guest) { const g = await ensureGuestToken(); if (g) headers['X-Guest-Token'] = g; }

  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  let res;
  try {
    res = await fetch(`${BASE}${path}${qs(params)}`, { method, headers, body: payload, signal, cache: 'no-store' });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new ApiError('We can’t reach the server. Check your internet connection and try again.', 0, 'NETWORK');
  }

  const json = await res.json().catch(() => null);

  if (res.status === 401 && auth && !_retried && storage.get(REALMS[realm].refresh)) {
    if (await refreshSession(realm)) return request(path, { ...opts, _retried: true });
  }
  if (!res.ok || json?.success === false) {
    throw new ApiError(json?.message || `Something went wrong (${res.status}). Please try again.`, res.status, json?.error_code, json?.details);
  }
  return json || { success: true, data: null };
}

export const api = {
  get: (path, params, opts) => request(path, { params, ...opts }),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts) => request(path, { method: 'PUT', body, ...opts }),
  patch: (path, body, opts) => request(path, { method: 'PATCH', body, ...opts }),
  del: (path, opts) => request(path, { method: 'DELETE', ...opts }),
  upload: (path, form, opts) => request(path, { method: 'POST', form, ...opts }),
};

export const apiUrl = (path) => `${BASE}${path}`;

/** Staff API: separate token realm, never sends the shopper guest token. */
const A = { realm: 'admin', guest: false };
export const adminApi = {
  get: (path, params, opts) => request(path, { params, ...A, ...opts }),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...A, ...opts }),
  put: (path, body, opts) => request(path, { method: 'PUT', body, ...A, ...opts }),
  patch: (path, body, opts) => request(path, { method: 'PATCH', body, ...A, ...opts }),
  del: (path, opts) => request(path, { method: 'DELETE', ...A, ...opts }),
  upload: (path, form, opts) => request(path, { method: 'POST', form, ...A, ...opts }),
};
