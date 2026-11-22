function waDigits(raw) {
  let n = String(raw || '').replace(/\D/g, '');
  if (n.startsWith('0') && n.length === 11) n = '234' + n.slice(1); // 0803... -> 234803...
  return n;
}

export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Just Drugs';
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');
export const WHATSAPP_NUMBER = waDigits(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '09028022359');
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '09028022359';
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '';
export const waDigitsOf = waDigits;

/** Public origin: the real browser origin on the client, SITE_URL on the server. */
export function siteOrigin() {
  if (typeof window !== 'undefined') return window.location.origin;
  return SITE_URL;
}
