import { ImageResponse } from 'next/og';
import { STORE_NAME } from '@/lib/config';

export const alt = `${STORE_NAME} — online pharmacy`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: 'linear-gradient(135deg,#0A3D2C 0%,#0F6648 100%)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', width: 96, height: 96, borderRadius: 28, background: '#072B1F', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', width: 64, height: 28, borderRadius: 14, overflow: 'hidden', transform: 'rotate(-40deg)' }}>
              <div style={{ width: 32, height: 28, background: '#fff' }} />
              <div style={{ width: 32, height: 28, background: '#FFC21F' }} />
            </div>
          </div>
          <div style={{ marginLeft: 28, fontSize: 64, fontWeight: 800 }}>{STORE_NAME}</div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>Your pharmacy, delivered across Nigeria.</div>
        <div style={{ marginTop: 32, fontSize: 34, color: '#A9D6BC' }}>Order online or on WhatsApp · Pay with Paystack · Track delivery</div>
      </div>
    ),
    { ...size },
  );
}
