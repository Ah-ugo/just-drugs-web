import { Suspense } from 'react';
import { VerifyEmailView } from '@/components/auth/AuthForms';

export const metadata = { title: 'Verify email', robots: { index: false } };
export default function Page() { return <Suspense fallback={null}><VerifyEmailView /></Suspense>; }
