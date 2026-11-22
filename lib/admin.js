import { parseDate } from './format';

export const slugify = (s) => String(s || '').toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const linesToArray = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
export const arrayToLines = (a) => (Array.isArray(a) ? a.join('\n') : '');
export const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
export const toISODate = (v) => (v ? new Date(`${v}T00:00:00`).toISOString() : null);
export const fromISODate = (v) => { const d = parseDate(v); return d ? d.toISOString().slice(0, 10) : ''; };

/** Stable pseudo public_id for images that live on an external URL. */
export function urlId(url) {
  let h = 0;
  for (let i = 0; i < url.length; i += 1) h = (h * 31 + url.charCodeAt(i)) | 0;
  return `ext_${Math.abs(h).toString(36)}`;
}

export function timeAgo(value) {
  const d = parseDate(value);
  if (!d) return '';
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
  const dd = Math.floor(h / 24); if (dd < 30) return `${dd} day${dd > 1 ? 's' : ''} ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
