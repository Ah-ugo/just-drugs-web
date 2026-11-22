import './globals.css';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import Providers from '@/components/layout/Providers';
import AppShell from '@/components/layout/AppShell';
import { getSettings, getCategories } from '@/lib/server-api';
import { SITE_URL, STORE_NAME } from '@/lib/config';

// latin-ext carries the Naira sign (₦) in most Google fonts.
const display = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext'], variable: '--font-display', display: 'swap' });
const body = Figtree({ subsets: ['latin', 'latin-ext'], variable: '--font-body', display: 'swap' });

const DESCRIPTION = `Order medicines and health essentials online or on WhatsApp in Nigeria. Pay securely with Paystack, upload your prescription, and track your delivery. ${STORE_NAME}.`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${STORE_NAME} — Order medicines online or on WhatsApp in Nigeria`, template: `%s | ${STORE_NAME}` },
  description: DESCRIPTION,
  applicationName: STORE_NAME,
  keywords: ['online pharmacy Nigeria', 'buy drugs online Nigeria', 'medicine delivery', 'order drugs on WhatsApp', 'prescription upload'],
  openGraph: { type: 'website', locale: 'en_NG', siteName: STORE_NAME, title: `${STORE_NAME} — Your pharmacy, delivered`, description: DESCRIPTION, url: '/' },
  twitter: { card: 'summary_large_image', title: STORE_NAME, description: DESCRIPTION },
  alternates: { canonical: '/' },
  formatDetection: { telephone: false },
};

export const viewport = { themeColor: '#0A3D2C', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <html lang="en-NG" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers settings={settings} categories={categories}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
