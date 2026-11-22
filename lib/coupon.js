import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { storage } from './storage';
import { couponSupported } from './pricing';

const KEY = 'jd_coupon';

export function useCoupon() {
  const [coupon, setCoupon] = useState(null);
  useEffect(() => { setCoupon(storage.getJSON(KEY)); }, []);

  const apply = useCallback(async (code, subtotal) => {
    const c = String(code || '').trim().toUpperCase();
    if (!c) throw new Error('Enter a coupon code.');
    const r = await api.get('/discounts/validate', { code: c, subtotal }, { auth: false, guest: false });
    const d = r.data;
    if (!couponSupported(d)) throw new Error('This coupon can’t be applied at checkout.');
    const next = { code: d.code || c, type: d.type, value: d.value, name: d.name };
    storage.setJSON(KEY, next);
    setCoupon(next);
    return next;
  }, []);

  const remove = useCallback(() => { storage.remove(KEY); setCoupon(null); }, []);
  return { coupon, apply, remove };
}
