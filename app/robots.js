import { SITE_URL } from '@/lib/config';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/cart', '/checkout', '/account', '/orders', '/invoice', '/login', '/register', '/reset-password', '/verify-email', '/backend/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
