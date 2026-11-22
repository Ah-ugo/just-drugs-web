'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi, clearTokens, getAdminTokens, setTokens } from '@/lib/api';
import { hasPermission } from '@/lib/rbac';

const AdminCtx = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authed | guest

  const loadMe = useCallback(async () => {
    try {
      const r = await adminApi.get('/admin/auth/me');
      setAdmin(r.data);
      setStatus('authed');
      return r.data;
    } catch (e) {
      if (e.status === 401 || e.status === 403) clearTokens(false, 'admin');
      setAdmin(null);
      setStatus('guest');
      return null;
    }
  }, []);

  useEffect(() => {
    const t = getAdminTokens();
    if (t.access || t.refresh) loadMe(); else setStatus('guest');
    const expired = () => { setAdmin(null); setStatus('guest'); };
    window.addEventListener('jd:admin-session-expired', expired);
    return () => window.removeEventListener('jd:admin-session-expired', expired);
  }, [loadMe]);

  const login = useCallback(async (email, password) => {
    const r = await adminApi.post('/admin/auth/login', { email: email.trim().toLowerCase(), password }, { auth: false });
    setTokens(r.data, 'admin');
    return loadMe();
  }, [loadMe]);

  const logout = useCallback(async () => {
    const { refresh } = getAdminTokens();
    if (refresh) adminApi.post('/admin/auth/logout', { refresh_token: refresh }, { auth: false }).catch(() => {});
    clearTokens(false, 'admin');
    setAdmin(null);
    setStatus('guest');
  }, []);

  const value = useMemo(() => ({
    admin, status, login, logout,
    can: (perm) => !!admin && (admin.role === 'super_admin' || hasPermission(admin.role, admin.permissions, perm)),
    isRole: (...roles) => !!admin && (admin.role === 'super_admin' || roles.includes(admin.role)),
  }), [admin, status, login, logout]);

  return <AdminCtx.Provider value={value}>{children}</AdminCtx.Provider>;
}

export const useAdmin = () => useContext(AdminCtx);
