import { sget } from './server-api';

const PASS = ['category_id', 'brand_id', 'manufacturer', 'min_price', 'max_price', 'requires_prescription', 'featured', 'popular', 'new_arrival', 'best_seller', 'sort_by', 'q'];

/** Loads one page of the catalogue from the combined /shop endpoint. */
export async function loadCatalog(searchParams = {}, extra = {}) {
  const params = { limit: 20, page: Math.max(1, parseInt(searchParams.page, 10) || 1), ...extra };
  PASS.forEach((k) => { if (searchParams[k]) params[k] = searchParams[k]; });
  const r = await sget('/shop', { params, revalidate: 60 });
  return {
    ok: r.ok,
    products: r.data?.products || [],
    banners: r.data?.banners || {},
    filters: r.data?.filters || {},
    meta: r.meta,
  };
}
