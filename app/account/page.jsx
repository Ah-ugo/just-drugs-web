import { Suspense } from 'react';
import AccountView from '@/components/account/AccountView';

export const metadata = { title: 'My account', robots: { index: false } };
export default function AccountPage() { return <Suspense fallback={null}><AccountView /></Suspense>; }
