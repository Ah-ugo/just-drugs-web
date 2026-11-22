import OrderView from '@/components/invoice/OrderView';

export const metadata = { title: 'Order details', robots: { index: false } };
export default function OrderPage({ params }) { return <OrderView orderNumber={decodeURIComponent(params.orderNumber)} />; }
