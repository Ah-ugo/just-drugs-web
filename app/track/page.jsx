import { Suspense } from 'react';
import TrackView from '@/components/invoice/TrackView';

export const metadata = { title: 'Track your order', description: 'Follow your medicine delivery from packing to your doorstep.', alternates: { canonical: '/track' } };
export default function TrackPage() { return <Suspense fallback={null}><TrackView /></Suspense>; }
