import ProductForm from '@/components/admin/ProductForm';

export const metadata = { title: 'Edit product' };
export default function Page({ params }) { return <ProductForm id={params.id} />; }
