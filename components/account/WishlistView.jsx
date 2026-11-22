'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Heading, SimpleGrid } from '@chakra-ui/react';
import { EmptyState, Page, ProductSkeletons } from '@/components/ui/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import { api } from '@/lib/api';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistView() {
  const wl = useWishlist();
  const [products, setProducts] = useState(null);
  useEffect(() => { api.get('/wishlist').then((r) => setProducts(r.data?.products || [])).catch(() => setProducts([])); }, []);
  const shown = (products || []).filter((p) => wl.has(p._id));

  return (
    <Page py={{ base: 5, md: 10 }}>
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }} mb={6}>Your wishlist</Heading>
      {products === null ? <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}><ProductSkeletons count={4} /></SimpleGrid>
        : shown.length ? <ProductGrid products={shown} />
        : <EmptyState icon="heart" title="Nothing saved yet" text="Tap the heart on any medicine to keep it here for later."><Button as={NextLink} href="/shop" variant="buy">Browse medicines</Button></EmptyState>}
    </Page>
  );
}
