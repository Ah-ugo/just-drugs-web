// localStorage that never throws (private mode, blocked storage, SSR).
export const storage = {
  get(key) {
    try { return typeof window === 'undefined' ? null : window.localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); } catch {}
  },
  remove(key) {
    try { if (typeof window !== 'undefined') window.localStorage.removeItem(key); } catch {}
  },
  getJSON(key, fallback = null) {
    try { const v = this.get(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  setJSON(key, value) { this.set(key, JSON.stringify(value)); },
};
