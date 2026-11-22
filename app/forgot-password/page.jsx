import { Suspense } from 'react';
import { ForgotView } from '@/components/auth/AuthForms';

export const metadata = { title: 'Forgot password', robots: { index: false } };
export default function Page() { return <Suspense fallback={null}><ForgotView /></Suspense>; }
