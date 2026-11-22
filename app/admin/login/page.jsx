import { Suspense } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';

export const metadata = { title: 'Sign in' };
export default function Page() { return <Suspense fallback={null}><AdminLogin /></Suspense>; }
