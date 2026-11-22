import { Suspense } from 'react';
import { LoginView } from '@/components/auth/AuthForms';

export const metadata = { title: 'Sign in', robots: { index: false } };
export default function Page() { return <Suspense fallback={null}><LoginView /></Suspense>; }
