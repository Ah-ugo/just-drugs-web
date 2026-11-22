'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useNotify } from '@/lib/hooks';
import { useAuth } from './AuthContext';

const WishCtx = createContext(null);
const FLAG = 'jd_has_wl';

export function WishlistProvider({ children }) {
  const { status } = useAuth();
  const notify = useNotify();
  const [ids, setIds] = useState([]);
  const inFlightRef = useRef(new Set());

  const load = useCallback(async () => {
    try {
      const r = await api.get('/wishlist');
      setIds(r.data?.product_ids || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authed' || storage.get(FLAG)) load();
    else setIds([]);
  }, [status, load]);

  useEffect(() => {
    const h = () => load();
    window.addEventListener('jd:auth-changed', h);
    return () => window.removeEventListener('jd:auth-changed', h);
  }, [load]);

  const toggle = useCallback(
    async (product) => {
      const id = product._id || product.id;
      if (!id) return;
      if (inFlightRef.current.has(id)) return;
      inFlightRef.current.add(id);

      const had = ids.includes(id);
      setIds((l) => (had ? l.filter((x) => x !== id) : [...l, id]));
      try {
        const r = await api.post('/wishlist/toggle', { product_id: id });
        storage.set(FLAG, '1');
        setIds(r.data?.product_ids || []);
        notify.success(had ? 'Removed from wishlist' : 'Saved to wishlist', product.name);
      } catch (e) {
        setIds((l) => (had ? [...l, id] : l.filter((x) => x !== id)));
        if (e?.code === 'DUPLICATE_RECORD' || e?.status === 409) {
          // Re-sync quietly if concurrent creation occurred
          load();
        } else {
          notify.error('Couldn’t update wishlist', e.message);
        }
      } finally {
        inFlightRef.current.delete(id);
      }
    },
    [ids, notify, load]
  );

  const value = useMemo(
    () => ({ ids, count: ids.length, has: (id) => ids.includes(id), toggle, reload: load }),
    [ids, toggle, load]
  );
  return <WishCtx.Provider value={value}>{children}</WishCtx.Provider>;
}

export const useWishlist = () => useContext(WishCtx);
