'use client';

import { Box, Skeleton, SimpleGrid } from '@chakra-ui/react';
import { Page, ProductSkeletons } from '@/components/ui/Layout';

export default function Loading() {
  return (
    <Page py={8}>
      <Skeleton h="44px" w={{ base: '70%', md: '320px' }} borderRadius="xl" mb={6} />
      <Box mb={6}><Skeleton h="140px" borderRadius="2xl" /></Box>
      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={{ base: 3, md: 5 }}><ProductSkeletons count={8} /></SimpleGrid>
    </Page>
  );
}
