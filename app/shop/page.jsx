import { Suspense } from 'react';
import CatalogView from '@/components/shop/CatalogView';
import { loadCatalog } from '@/lib/catalog';

export function generateMetadata({ searchParams }) {
  const q = searchParams?.q;
  return {
    title: q ? `Search results for “${q}”` : 'Shop all medicines',
    description: q ? `Medicines matching “${q}” — order online or on WhatsApp in Nigeria.` : 'Browse pain relief, malaria, vitamins, baby care and more. Order online or on WhatsApp with delivery across Nigeria.',
    alternates: { canonical: '/shop' },
    robots: q || searchParams?.page ? { index: false, follow: true } : undefined,
  };
}

const FEATURE_TITLES = { featured: 'Pharmacist picks', popular: 'Most popular', new_arrival: 'New arrivals', best_seller: 'Best sellers' };

export default async function ShopPage({ searchParams }) {
  const data = await loadCatalog(searchParams);
  const flag = Object.keys(FEATURE_TITLES).find((k) => searchParams[k] === 'true');
  const title = searchParams.q ? 'Search results' : flag ? FEATURE_TITLES[flag] : 'All medicines';
  return (
    <Suspense fallback={null}>
      <CatalogView {...data} title={title} query={searchParams.q} failed={!data.ok} />
    </Suspense>
  );
}
