'use client';
import { AdminProvider } from '@/context/AdminContext';
import AdminShell from './AdminShell';

export default function AdminRoot({ children }) {
  return <AdminProvider><AdminShell>{children}</AdminShell></AdminProvider>;
}
