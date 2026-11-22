'use client';
import { useState } from 'react';
import { Box, HStack } from '@chakra-ui/react';
import ProductImage from '@/components/ui/ProductImage';
import { optimizeImage } from '@/lib/images';

export default function ProductGallery({ product }) {
  const imgs = (product.images || []).filter((i) => i.url);
  const [active, setActive] = useState(0);
  return (
    <Box>
      <ProductImage key={active} product={product} src={imgs[active] ? optimizeImage(imgs[active].url, 900) : null} width={900} priority rounded="3xl"
        border="1px solid" borderColor="ink.100" />
      {imgs.length > 1 && (
        <HStack mt={3} spacing={2.5} overflowX="auto" className="hide-scrollbar" role="tablist" aria-label="Product images">
          {imgs.map((im, i) => (
            <Box as="button" key={im.public_id || im.url} role="tab" aria-selected={i === active} aria-label={`Image ${i + 1}`} onClick={() => setActive(i)}
              flexShrink={0} w="68px" h="68px" borderRadius="xl" overflow="hidden" bg="white" border="2px solid" borderColor={i === active ? 'pine.500' : 'ink.100'}>
              <img src={optimizeImage(im.url, 160)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
            </Box>
          ))}
        </HStack>
      )}
    </Box>
  );
}
