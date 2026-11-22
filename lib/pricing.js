const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Mirrors the backend's checkout maths so the number shown is the number charged. */
export function calcTotals({ subtotal = 0, discount = 0, deliveryFee = 0, freeThreshold = Infinity, taxRate = 0 }) {
  const sub = Number(subtotal) || 0;
  const delivery = sub > 0 && sub < freeThreshold ? Number(deliveryFee) : 0;
  const taxable = Math.max(0, sub - discount);
  const tax = round2((taxable * taxRate) / 100);
  return { subtotal: sub, discount: round2(discount), delivery, tax, total: round2(taxable + tax + delivery) };
}

/** Backend supports `percentage` and `fixed_amount` coupons at checkout. */
export function couponDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.type === 'percentage') return round2((Number(coupon.value) / 100) * subtotal);
  if (coupon.type === 'fixed_amount') return round2(Math.min(Number(coupon.value), subtotal));
  return 0;
}
export const couponSupported = (c) => ['percentage', 'fixed_amount'].includes(c?.type);
