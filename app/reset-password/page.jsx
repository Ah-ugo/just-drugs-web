import { Suspense } from 'react';
import { ResetView } from '@/components/auth/AuthForms';

export const metadata = { title: 'Reset password', robots: { index: false } };
export default function Page() { return <Suspense fallback={null}><ResetView /></Suspense>; }
