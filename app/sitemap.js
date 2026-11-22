import { SITE_URL } from '@/lib/config';
import { sget } from '@/lib/server-api';

export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();
  const entries = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/prescriptions`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/track`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const cats = await sget('/categories', { revalidate: 3600 });
  (cats.data || []).forEach((c) => entries.push({ url: `${SITE_URL}/category/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 }));

  for (let page = 1; page <= 50; page += 1) {
    const r = await sget('/products', { params: { page, limit: 100 }, revalidate: 3600 });
    if (!r.ok) break;
    (r.data || []).forEach((p) => entries.push({
      url: `${SITE_URL}/drugs/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
    if (page >= (r.meta?.pages || 1)) break;
  }
  return entries;
}
