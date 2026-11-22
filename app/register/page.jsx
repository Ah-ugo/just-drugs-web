import { Suspense } from 'react';
import { RegisterView } from '@/components/auth/AuthForms';

export const metadata = { title: 'Create account', robots: { index: false } };
export default function Page() { return <Suspense fallback={null}><RegisterView /></Suspense>; }
