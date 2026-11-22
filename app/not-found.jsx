'use client';

import NextLink from 'next/link';
import { Button } from '@chakra-ui/react';
import { EmptyState } from '@/components/ui/Layout';

export default function NotFound() {
  return (
    <EmptyState icon="search" title="We couldn’t find that page" text="The medicine or page you’re looking for may have moved. Try searching the shop.">
      <Button as={NextLink} href="/shop" variant="buy">Browse all medicines</Button>
    </EmptyState>
  );
}
