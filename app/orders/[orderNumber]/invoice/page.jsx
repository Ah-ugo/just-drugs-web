import InvoiceView from '@/components/invoice/InvoiceView';

export const metadata = { title: 'Invoice', robots: { index: false } };
export default function InvoicePage({ params }) { return <InvoiceView orderNumber={decodeURIComponent(params.orderNumber)} />; }
