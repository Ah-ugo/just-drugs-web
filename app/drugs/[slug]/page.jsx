import { notFound } from 'next/navigation';
import ProductView from '@/components/product/ProductView';
import { EmptyState } from '@/components/ui/Layout';
import { sget } from '@/lib/server-api';
import { money } from '@/lib/format';
import { priceInfo, productMeta } from '@/lib/product';
import { productJsonLd, trimText } from '@/lib/seo';

export const revalidate = 60;

async function getProduct(slug) {
  const r = await sget(`/products/${slug}`, { revalidate: 60 });
  if (r.ok && (r.data.active === false || r.data.published === false)) return { ok: false, status: 404 };
  return r;
}

export async function generateMetadata({ params }) {
  const r = await getProduct(params.slug);
  if (!r.ok) return { title: 'Medicine not found', robots: { index: false } };
  const p = r.data;
  const price = money(priceInfo(p).current);
  const meta = productMeta(p);
  const title = `${p.name}${meta ? ` (${meta})` : ''} — ${price}`;
  const description = trimText(`${p.name} ${price}. ${p.description || ''} Order online or on WhatsApp.`, 160);
  const url = `/drugs/${p.slug}`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { type: 'website', title, description, url },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ProductPage({ params }) {
  const r = await getProduct(params.slug);
  if (!r.ok) {
    if (r.status === 404) notFound();
    return <EmptyState icon="refresh" title="We couldn’t load this medicine" text="Check your connection and refresh the page." />;
  }
  const p = r.data;
  const [rev, rel] = await Promise.all([
    sget(`/reviews/products/${p._id}`, { revalidate: 60 }),
    sget('/products', { params: { category_id: p.category_id, limit: 9 }, revalidate: 120 }),
  ]);
  const reviews = rev.data || { reviews: [], average_rating: 0, total_reviews: 0 };
  const related = (rel.data || []).filter((x) => x._id !== p._id).slice(0, 8);
  const ld = productJsonLd(p, { rating: reviews.average_rating, reviewCount: reviews.total_reviews });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <ProductView product={p} reviews={reviews} related={related} />
    </>
  );
}
