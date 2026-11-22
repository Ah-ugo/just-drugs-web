import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import CatalogView from '@/components/shop/CatalogView';
import { loadCatalog } from '@/lib/catalog';
import { sget } from '@/lib/server-api';
import { trimText } from '@/lib/seo';

async function getCategory(slug) {
  const r = await sget(`/categories/${slug}`, { revalidate: 300 });
  return r.ok ? r.data : null;
}

export async function generateMetadata({ params }) {
  const c = await getCategory(params.slug);
  if (!c) return { title: 'Category not found', robots: { index: false } };
  return {
    title: `${c.name} — buy online in Nigeria`,
    description: trimText(c.description || `Shop ${c.name} medicines and essentials. Order online or on WhatsApp with delivery across Nigeria.`),
    alternates: { canonical: `/category/${c.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const category = await getCategory(params.slug);
  if (!category) notFound();
  const data = await loadCatalog(searchParams, { category_slug: params.slug });
  return (
    <Suspense fallback={null}>
      <CatalogView {...data} category={category} title={category.name} emoji={category.emoji} subtitle={category.description} query={searchParams.q} failed={!data.ok} />
    </Suspense>
  );
}
