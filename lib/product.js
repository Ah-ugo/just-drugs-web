import { optimizeImage } from './images';

export const productUrl = (slug) => `/drugs/${slug}`;

export function primaryImage(p, width = 600) {
  const imgs = p?.images || [];
  const img = imgs.find((i) => i.is_primary) || imgs[0];
  return img?.url ? optimizeImage(img.url, width) : null;
}

export function priceInfo(p) {
  const price = Number(p?.price || 0);
  const disc = Number(p?.discount_price || 0);
  const onSale = disc > 0 && disc < price;
  return {
    price,
    current: onSale ? disc : price,
    old: onSale ? price : null,
    percent: onSale ? Math.round((1 - disc / price) * 100) : 0,
    onSale,
  };
}

export function stockInfo(p) {
  const status = p?.stock_status || 'IN_STOCK';
  const qty = Number(p?.available_stock ?? 0);
  return { status, qty, out: status === 'OUT_OF_STOCK' || qty <= 0, low: status === 'LOW_STOCK', max: Math.max(qty, 0) };
}

export function productMeta(p) {
  return [p?.strength && p.strength !== 'Standard' ? p.strength : null, p?.dosage_form].filter(Boolean).join(' · ');
}
