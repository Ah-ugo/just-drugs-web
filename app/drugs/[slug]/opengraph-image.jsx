import { ImageResponse } from 'next/og';
import { sget } from '@/lib/server-api';
import { STORE_NAME } from '@/lib/config';

export const alt = 'Medicine details';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Satori only decodes PNG/JPEG, so ask the image CDN for JPEG.
function jpeg(url) {
  if (!url) return null;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) return url.replace('/upload/', '/upload/f_jpg,q_80,w_640,c_pad,b_white/');
  if (url.includes('images.unsplash.com')) return `${url.split('?')[0]}?w=640&fm=jpg&q=80`;
  return url;
}

export default async function Image({ params }) {
  const r = await sget(`/products/${params.slug}`);
  const p = r.data;
  const name = p?.name || 'Medicine';
  const disc = Number(p?.discount_price || 0);
  const price = disc > 0 && disc < Number(p?.price) ? disc : Number(p?.price || 0);
  const photo = jpeg(p?.images?.[0]?.url);
  const meta = [p?.brand_name, p?.strength !== 'Standard' ? p?.strength : null, p?.dosage_form].filter(Boolean).join(' · ');

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg,#0A3D2C 0%,#0F6648 100%)', color: '#fff', padding: 56 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, paddingRight: 40 }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: '#FFC21F' }}>{STORE_NAME}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {meta ? <div style={{ display: 'flex', fontSize: 30, color: '#A9D6BC', marginBottom: 14 }}>{meta}</div> : null}
            <div style={{ display: 'flex', fontSize: name.length > 34 ? 56 : 72, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
            <div style={{ display: 'flex', marginTop: 28, fontSize: 64, fontWeight: 800, color: '#FFC21F' }}>{`NGN ${price.toLocaleString('en-NG')}`}</div>
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#D5EBDD' }}>Order online or on WhatsApp</div>
        </div>
        {photo ? (
          <div style={{ display: 'flex', width: 440, height: 518, borderRadius: 36, background: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={photo} width={400} height={400} style={{ objectFit: 'contain' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', width: 440, height: 518, borderRadius: 36, background: '#E4F2EA', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', width: 150, height: 150, borderRadius: 40, background: '#0A3D2C', color: '#fff', fontSize: 110, fontWeight: 800, alignItems: 'center', justifyContent: 'center' }}>+</div>
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
