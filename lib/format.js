const nf0 = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function money(value, symbol = '₦') {
  const n = Number(value || 0);
  return `${symbol}${Number.isInteger(n) ? nf0.format(n) : nf2.format(n)}`;
}

/** Backend datetimes are UTC but often serialised without a "Z". */
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value);
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s);
  const d = new Date(hasZone ? s : `${s}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = parseDate(value);
  return d ? new Intl.DateTimeFormat('en-NG', opts).format(d) : '';
}

export function fmtDateTime(value) {
  return fmtDate(value, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Normalise Nigerian numbers to +234XXXXXXXXXX (the backend accepts +?10-15 digits, no spaces). */
export function normalizePhone(input) {
  let p = String(input || '').trim().replace(/[\s().-]/g, '');
  const plus = p.startsWith('+');
  p = p.replace(/\D/g, '');
  if (plus) return `+${p}`;
  if (p.startsWith('234') && p.length === 13) return `+${p}`;
  if (p.startsWith('0') && p.length === 11) return `+234${p.slice(1)}`;
  if (p.length === 10 && /^[789]/.test(p)) return `+234${p}`;
  return p;
}

/** Nigerian mobile (070/080/081/090/091…) or any international E.164-style number. */
export function isValidPhone(input) {
  const p = normalizePhone(input);
  if (p.startsWith('+234')) return /^\+234[789][01]\d{8}$/.test(p);
  return /^\+\d{10,15}$/.test(p); // other countries need the + prefix
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim());

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River',
  'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
  'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export const pluralize = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const ORDER_STATUS = {
  pending_payment: { label: 'Awaiting payment', color: 'orange', step: 0 },
  preparing: { label: 'Preparing your order', color: 'blue', step: 1 },
  packed: { label: 'Packed', color: 'blue', step: 2 },
  assigned: { label: 'Rider assigned', color: 'purple', step: 3 },
  picked_up: { label: 'Picked up', color: 'purple', step: 4 },
  out_for_delivery: { label: 'Out for delivery', color: 'purple', step: 5 },
  delivered: { label: 'Delivered', color: 'green', step: 6 },
  cancelled: { label: 'Cancelled', color: 'red', step: -1 },
};
export const statusInfo = (s) => ORDER_STATUS[s] || { label: String(s || 'Unknown').replace(/_/g, ' '), color: 'gray', step: 0 };

export const RX_STATUS = {
  pending: { label: 'Awaiting pharmacist', color: 'orange' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  need_better_image: { label: 'Needs a clearer photo', color: 'orange' },
  expired: { label: 'Expired', color: 'gray' },
};
