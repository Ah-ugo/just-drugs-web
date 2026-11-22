'use client';
import { Box } from '@chakra-ui/react';
import ProductCard from '@/components/product/ProductCard';

/** Swipeable row on phones, 4-up grid on larger screens. */
export default function ProductRail({ products = [] }) {
  return (
    <Box display={{ base: 'flex', md: 'grid' }} gridTemplateColumns={{ md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={{ base: 3, md: 5 }}
      overflowX={{ base: 'auto', md: 'visible' }} mx={{ base: -4, md: 0 }} px={{ base: 4, md: 0 }} pb={{ base: 2, md: 0 }} sx={{ scrollSnapType: 'x proximity' }} className="hide-scrollbar">
      {products.slice(0, 8).map((p, i) => (
        <Box key={p._id} flex={{ base: '0 0 60%', sm: '0 0 40%', md: 'initial' }} maxW={{ base: '250px', md: 'none' }} sx={{ scrollSnapAlign: 'start' }} display={{ base: 'block', md: i >= 8 ? 'none' : 'block' }}>
          <ProductCard product={p} />
        </Box>
      ))}
    </Box>
  );
}
