import HomeView from '@/components/home/HomeView';
import { sget } from '@/lib/server-api';
import { SITE_URL, STORE_NAME } from '@/lib/config';

export const revalidate = 60;

export default async function HomePage() {
  const r = await sget('/homepage', { revalidate: 60 });
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Pharmacy',
    name: STORE_NAME,
    url: SITE_URL,
    areaServed: 'NG',
    potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/shop?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <HomeView data={r.data || {}} />
    </>
  );
}
