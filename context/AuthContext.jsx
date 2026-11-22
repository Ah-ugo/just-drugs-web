'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearTokens, getTokens, setTokens, KEYS } from '@/lib/api';
import { storage } from '@/lib/storage';

const AuthCtx = createContext(null);
const announce = () => typeof window !== 'undefined' && window.dispatchEvent(new Event('jd:auth-changed'));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authed | guest

  const loadMe = useCallback(async () => {
    try {
      const r = await api.get('/users/me');
      setUser(r.data);
      setStatus('authed');
      return r.data;
    } catch (e) {
      if (e.status === 401 || e.status === 403) clearTokens();
      setUser(null);
      setStatus('guest');
      return null;
    }
  }, []);

  useEffect(() => {
    const t = getTokens();
    if (t.access || t.refresh) loadMe(); else setStatus('guest');
    const expired = () => { setUser(null); setStatus('guest'); };
    window.addEventListener('jd:session-expired', expired);
    return () => window.removeEventListener('jd:session-expired', expired);
  }, [loadMe]);

  const login = useCallback(async (email, password) => {
    const r = await api.post('/auth/login', { email: email.trim().toLowerCase(), password }, { auth: false });
    setTokens(r.data);
    const me = await loadMe();
    // Bring anything added as a guest into the account.
    if (storage.get(KEYS.guest)) {
      await api.post('/cart/merge').catch(() => {});
      await api.post('/wishlist/merge', { guest_token: storage.get(KEYS.guest) }).catch(() => {});
    }
    announce();
    return me;
  }, [loadMe]);

  const register = useCallback(async (payload) => {
    const r = await api.post('/auth/register', payload, { auth: false });
    return r.data;
  }, []);

  const logout = useCallback(async () => {
    const { refresh } = getTokens();
    if (refresh) api.post('/auth/logout', { refresh_token: refresh }, { auth: false }).catch(() => {});
    clearTokens();
    setUser(null);
    setStatus('guest');
    announce();
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthed: status === 'authed', login, register, logout, reload: loadMe, setUser }),
    [user, status, login, register, logout, loadMe],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
