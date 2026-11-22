import { Suspense } from 'react';
import VerifyView from '@/components/checkout/VerifyView';

export const metadata = { title: 'Confirming payment', robots: { index: false } };
export default function VerifyPage() { return <Suspense fallback={null}><VerifyView /></Suspense>; }
