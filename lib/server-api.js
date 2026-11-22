// Server-side data fetching for Server Components / metadata / sitemap.
// Failures never throw: pages render a friendly empty state instead of crashing.
const BASE = (process.env.API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

const qs = (params) => {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export async function sget(path, { params, revalidate = 60, timeout = 10000 } = {}) {
  try {
    const res = await fetch(`${BASE}${path}${qs(params)}`, {
      next: { revalidate },
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeout),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.success === false) return { ok: false, status: res.status, data: null, meta: null };
    return { ok: true, status: res.status, data: json.data, meta: json.meta || null };
  } catch {
    return { ok: false, status: 0, data: null, meta: null };
  }
}

export const getSettings = async () => (await sget('/settings', { revalidate: 300 })).data || {};
export const getCategories = async () => (await sget('/categories', { revalidate: 300 })).data || [];
