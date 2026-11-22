'use client';
import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import DrugArt, { tintFor } from './DrugArt';
import { primaryImage } from '@/lib/product';

/** Real product photo when available (Cloudinary-optimised); illustrated fallback otherwise. */
export default function ProductImage({ product, width = 600, priority = false, src, ratio = '1 / 1', rounded = 'none', ...rest }) {
  const [failed, setFailed] = useState(false);
  const url = !failed ? (src || primaryImage(product, width)) : null;
  const [from, to] = tintFor(product);
  return (
    <Box position="relative" overflow="hidden" borderRadius={rounded} sx={{ aspectRatio: ratio }}
      bg={url ? 'white' : `linear-gradient(145deg, ${from}, ${to})`} {...rest}>
      {url ? (
        <img src={url} alt={product?.name || ''} loading={priority ? 'eager' : 'lazy'} decoding="async"
          onError={() => setFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '6%' }} />
      ) : (
        <Box position="absolute" inset="0" p="12%"><DrugArt product={product} /></Box>
      )}
    </Box>
  );
}
