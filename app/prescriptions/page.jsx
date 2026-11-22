import PrescriptionsView from '@/components/account/PrescriptionsView';

export const metadata = { title: 'Upload your prescription', description: 'Upload a photo or PDF of your prescription for pharmacist review, then order your medicines online.', alternates: { canonical: '/prescriptions' } };
export default function PrescriptionsPage() { return <PrescriptionsView />; }
