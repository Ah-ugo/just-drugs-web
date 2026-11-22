'use client';
import { useEffect, useState } from 'react';
import { Button, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { useNotify } from '@/lib/hooks';
import { siteOrigin } from '@/lib/config';
import { shareProductMessage } from '@/lib/whatsapp';
import { productUrl } from '@/lib/product';

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch { return false; }
  }
}

export default function ShareMenu({ product, size = 'md', variant = 'outline' }) {
  const notify = useNotify();
  const [native, setNative] = useState(false);
  useEffect(() => { setNative(typeof navigator !== 'undefined' && !!navigator.share); }, []);

  const url = `${siteOrigin()}${productUrl(product.slug)}`;
  const text = shareProductMessage({ product, url });
  const enc = encodeURIComponent;
  const open = (href) => window.open(href, '_blank', 'noopener,noreferrer');

  return (
    <Menu placement="bottom-end" isLazy>
      <MenuButton as={Button} variant={variant} size={size} leftIcon={<Icon name="share" size={18} />}>Share</MenuButton>
      <MenuList borderRadius="xl" p={1.5} boxShadow="lift" zIndex={60}>
        <MenuItem borderRadius="lg" icon={<WhatsAppIcon size={18} />} onClick={() => open(`https://wa.me/?text=${enc(text)}`)}>WhatsApp</MenuItem>
        <MenuItem borderRadius="lg" icon={<Icon name="share" size={18} />} onClick={() => open(`https://t.me/share/url?url=${enc(url)}&text=${enc(product.name)}`)}>Telegram</MenuItem>
        <MenuItem borderRadius="lg" icon={<Icon name="share" size={18} />} onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`)}>Facebook</MenuItem>
        <MenuItem borderRadius="lg" icon={<Icon name="mail" size={18} />} onClick={() => { window.location.href = `mailto:?subject=${enc(product.name)}&body=${enc(text)}`; }}>Email</MenuItem>
        <MenuItem borderRadius="lg" icon={<Icon name="copy" size={18} />}
          onClick={async () => (await copyText(url) ? notify.success('Link copied', 'Paste it anywhere to share this drug.') : notify.error('Couldn’t copy', url))}>Copy link</MenuItem>
        {native && (
          <MenuItem borderRadius="lg" icon={<Icon name="share" size={18} />}
            onClick={() => navigator.share({ title: product.name, text: product.name, url }).catch(() => {})}>More options…</MenuItem>
        )}
      </MenuList>
    </Menu>
  );
}
