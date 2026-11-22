import { STORE_NAME } from '@/lib/config';

export default function manifest() {
  return {
    name: `${STORE_NAME} — Online Pharmacy`,
    short_name: STORE_NAME,
    description: 'Order medicines online or on WhatsApp. Pay with Paystack and track your delivery.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F3F7F4',
    theme_color: '#0A3D2C',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
