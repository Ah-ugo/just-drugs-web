'use client';
import NextLink from 'next/link';
import { Badge, Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Grid, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { Page, SectionHeading } from '@/components/ui/Layout';
import Rating from '@/components/ui/Rating';
import ProductGallery from './ProductGallery';
import BuyBox from './BuyBox';
import ProductInfo from './ProductInfo';
import Reviews from './Reviews';
import ProductRail from '@/components/home/ProductRail';
import { productMeta } from '@/lib/product';

export default function ProductView({ product: p, reviews, related }) {
  const meta = productMeta(p);
  return (
    <Page py={{ base: 4, md: 8 }} pb={{ base: 32, md: 8 }}>
      <Breadcrumb fontSize="sm" color="ink.500" mb={4} separator="›" spacing={1}>
        <BreadcrumbItem><BreadcrumbLink as={NextLink} href="/">Home</BreadcrumbLink></BreadcrumbItem>
        {p.category_name && <BreadcrumbItem><BreadcrumbLink as={NextLink} href={`/shop?category_id=${p.category_id}`}>{p.category_name}</BreadcrumbLink></BreadcrumbItem>}
        <BreadcrumbItem isCurrentPage><BreadcrumbLink noOfLines={1} maxW="200px">{p.name}</BreadcrumbLink></BreadcrumbItem>
      </Breadcrumb>

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr', lg: '1.05fr 1fr' }} gap={{ base: 6, md: 10 }} alignItems="start">
        <Box position={{ md: 'sticky' }} top={{ md: '110px' }}><ProductGallery product={p} /></Box>
        <VStack align="stretch" spacing={5}>
          <Box>
            {p.brand_name && <Text fontWeight={700} color="pine.500" mb={1}>{p.brand_name}</Text>}
            <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} lineHeight={1.1}>{p.name}</Heading>
            {p.generic_name && <Text color="ink.500" mt={1.5}>Generic: {p.generic_name}</Text>}
            <HStack mt={3} spacing={3} flexWrap="wrap">
              {meta && <Badge colorScheme="green" variant="subtle" fontSize="sm" px={3} py={1}>{meta}</Badge>}
              {reviews?.total_reviews > 0 && (
                <Box as="a" href="#reviews"><Rating value={reviews.average_rating} count={reviews.total_reviews} /></Box>
              )}
            </HStack>
          </Box>
          <BuyBox product={p} />
        </VStack>
      </Grid>

      <Box mt={{ base: 10, md: 16 }}><ProductInfo product={p} /></Box>
      <Box mt={{ base: 10, md: 16 }}><SectionHeading title="Reviews" /><Reviews productId={p._id} initial={reviews} /></Box>
      {related?.length > 0 && <Box mt={{ base: 10, md: 16 }}><SectionHeading title="You may also need" href="/shop" /><ProductRail products={related} /></Box>}
    </Page>
  );
}
