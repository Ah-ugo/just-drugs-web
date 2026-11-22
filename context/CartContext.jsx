'use client';
import dynamic from 'next/dynamic';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useDisclosure } from '@chakra-ui/react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useNotify } from '@/lib/hooks';
import { useAuth } from './AuthContext';

const PrescriptionModal = dynamic(() => import('@/components/product/PrescriptionModal'), { ssr: false });

const CartCtx = createContext(null);
const EMPTY = { items: [], subtotal: 0, item_count: 0, requires_prescription: false };
const FLAG = 'jd_has_cart';

const normalize = (c) => ({ ...EMPTY, ...(c || {}), items: c?.items || [] });
const recalc = (c) => ({
  ...c,
  subtotal: c.items.reduce((s, i) => s + i.total_price, 0),
  item_count: c.items.reduce((s, i) => s + i.quantity, 0),
  requires_prescription: c.items.some((i) => i.requires_prescription),
});

export function CartProvider({ children }) {
  const { status } = useAuth();
  const notify = useNotify();
  const drawer = useDisclosure();
  const rxModal = useDisclosure();
  const [pendingRx, setPendingRx] = useState(null);
  const [animatingId, setAnimatingId] = useState(null);
  const [cart, setCart] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState({});
  const [mounted, setMounted] = useState(false);
  const rxCacheRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    try {
      const list = storage.getJSON('jd_rx', []);
      rxCacheRef.current = Array.isArray(list) && list.length > 0;
    } catch { /* ignore */ }
  }, []);

  const mark = (id, v) => setBusy((b) => ({ ...b, [id]: v }));

  const hasUploadedRx = useCallback(() => {
    if (!mounted) return false;
    try {
      const list = storage.getJSON('jd_rx', []);
      rxCacheRef.current = Array.isArray(list) && list.length > 0;
      return rxCacheRef.current;
    } catch {
      return false;
    }
  }, [mounted]);

  const refresh = useCallback(async () => {
    try {
      const r = await api.get('/cart');
      setCart(normalize(r.data));
    } catch {
      /* keep last known cart */
    }
    setReady(true);
  }, []);

  // Don't create empty server carts for visitors who never added anything.
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authed' || storage.get(FLAG)) refresh();
    else setReady(true);
  }, [status, refresh]);

  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('jd:auth-changed', h);
    return () => window.removeEventListener('jd:auth-changed', h);
  }, [refresh]);

  // Fast optimistic add (like Facebook Like trigger) with Prescription gate
  const add = useCallback(
    async (product, qty = 1, { openDrawer = false, skipRxCheck = false } = {}) => {
      const id = product._id || product.id || product.product_id;
      if (!id) return false;

      // Gate: If drug requires prescription and customer has not uploaded one, prompt modal first
      if (product.requires_prescription && !skipRxCheck && !hasUploadedRx()) {
        setPendingRx({ product, qty, openDrawer });
        rxModal.onOpen();
        return false;
      }

      // 1. Instant Facebook-like micro-animation & tactile feedback
      setAnimatingId(id);
      setTimeout(() => setAnimatingId((cur) => (cur === id ? null : cur)), 600);

      // 2. Instant Optimistic local update (0ms latency)
      const prevCart = cart;
      const unitPrice = Number(
        product.discount_price ?? product.price ?? product.unit_price ?? 0
      );
      const name = product.name || product.product_name || 'Item';
      const img = product.images?.[0]?.url || product.image_url || '';
      const stock = product.stock ?? product.available_stock ?? 99;

      const existingIndex = cart.items.findIndex((i) => i.product_id === id);
      let nextItems;
      if (existingIndex >= 0) {
        nextItems = cart.items.map((it, idx) =>
          idx === existingIndex
            ? {
                ...it,
                quantity: it.quantity + qty,
                total_price: (it.quantity + qty) * it.unit_price,
              }
            : it
        );
      } else {
        nextItems = [
          ...cart.items,
          {
            product_id: id,
            product_name: name,
            unit_price: unitPrice,
            quantity: qty,
            total_price: unitPrice * qty,
            image_url: img,
            slug: product.slug || '',
            available_stock: stock,
            requires_prescription: !!product.requires_prescription,
            stock_valid: true,
          },
        ];
      }

      setCart(recalc({ ...cart, items: nextItems }));
      storage.set(FLAG, '1');

      // Instant drawer or toast feedback
      if (openDrawer) {
        drawer.onOpen();
      } else {
        notify.success('Added to cart', name);
      }

      // 3. Background server synchronization
      api
        .post('/cart/items', { product_id: id, quantity: qty })
        .then((r) => {
          setCart(normalize(r.data));
        })
        .catch((e) => {
          // Revert on error
          setCart(prevCart);
          notify.error('Couldn’t add to cart', e.message);
        });

      return true;
    },
    [cart, drawer, hasUploadedRx, notify, rxModal]
  );

  const remove = useCallback(
    async (productId) => {
      const prev = cart;
      setCart((c) =>
        recalc({ ...c, items: c.items.filter((i) => i.product_id !== productId) })
      );
      try {
        const r = await api.del(`/cart/items/${productId}`);
        setCart(normalize(r.data));
      } catch (e) {
        setCart(prev);
        notify.error('Couldn’t remove item', e.message);
      }
    },
    [cart, notify]
  );

  const setQty = useCallback(
    async (productId, qty) => {
      if (qty <= 0) return remove(productId);
      const prev = cart;
      setCart((c) =>
        recalc({
          ...c,
          items: c.items.map((i) =>
            i.product_id === productId
              ? { ...i, quantity: qty, total_price: i.unit_price * qty }
              : i
          ),
        })
      );
      try {
        const r = await api.put(`/cart/items/${productId}`, { quantity: qty });
        setCart(normalize(r.data));
      } catch (e) {
        setCart(prev);
        notify.error('Couldn’t update quantity', e.message);
      }
    },
    [cart, notify, remove]
  );

  const requestRxUpload = useCallback(
    (product, qty = 1, { openDrawer = false } = {}) => {
      setPendingRx({ product, qty, openDrawer });
      rxModal.onOpen();
    },
    [rxModal]
  );

  const clearLocal = useCallback(() => setCart(EMPTY), []);

  const value = useMemo(
    () => ({
      cart,
      items: cart.items,
      count: cart.item_count || 0,
      subtotal: cart.subtotal || 0,
      requiresRx: !!cart.requires_prescription,
      ready,
      busy,
      drawer,
      rxModal,
      animatingId,
      hasUploadedRx,
      requestRxUpload,
      getQty: (id) => cart.items.find((i) => i.product_id === id)?.quantity || 0,
      add,
      remove,
      setQty,
      refresh,
      clearLocal,
    }),
    [
      cart,
      ready,
      busy,
      drawer,
      rxModal,
      animatingId,
      hasUploadedRx,
      requestRxUpload,
      add,
      remove,
      setQty,
      refresh,
      clearLocal,
    ]
  );

  return (
    <CartCtx.Provider value={value}>
      {children}
      <PrescriptionModal
        isOpen={rxModal.isOpen}
        onClose={rxModal.onClose}
        pending={pendingRx}
        onApprovedAdd={(product, qty, options) =>
          add(product, qty, { ...options, skipRxCheck: true })
        }
      />
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
