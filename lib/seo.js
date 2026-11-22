import { SITE_URL, STORE_NAME } from './config';
import { primaryImage, priceInfo, stockInfo } from './product';

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const trimText = (s, n = 155) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

export function productJsonLd(p, { rating, reviewCount } = {}) {
  const { current } = priceInfo(p);
  const images = (p.images || []).map((i) => i.url).filter(Boolean);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: trimText(p.description, 300),
    sku: p.sku,
    category: p.category_name,
    url: absoluteUrl(`/drugs/${p.slug}`),
    ...(images.length ? { image: images } : {}),
    ...(p.brand_name ? { brand: { '@type': 'Brand', name: p.brand_name } } : {}),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/drugs/${p.slug}`),
      priceCurrency: 'NGN',
      price: current,
      itemCondition: 'https://schema.org/NewCondition',
      availability: stockInfo(p).out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: STORE_NAME },
    },
  };
  if (reviewCount > 0 && rating > 0) {
    ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: rating, reviewCount };
  }
  return ld;
}

export { primaryImage };
