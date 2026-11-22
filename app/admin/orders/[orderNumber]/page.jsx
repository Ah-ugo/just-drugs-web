import OrderDetail from '@/components/admin/OrderDetail';

export const metadata = { title: 'Order' };
export default function Page({ params }) { return <OrderDetail orderNumber={decodeURIComponent(params.orderNumber)} />; }
