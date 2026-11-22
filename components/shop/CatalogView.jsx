'use client';
import NextLink from 'next/link';
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import { Page, EmptyState } from '@/components/ui/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import AdCard, { adsOf } from '@/components/ui/AdCard';
import { FilterSidebar, FilterDrawerButton, SortSelect } from './FilterPanel';
import Pagination from './Pagination';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { useStore } from '@/context/StoreContext';
import { pluralize } from '@/lib/format';

export default function CatalogView({ title, subtitle, emoji, query, category, products, meta, filters, banners, failed }) {
  const { wa } = useStore();
  const topAds = adsOf(banners?.top);
  const midAds = adsOf(banners?.after_8);
  const inserts = {};
  if (midAds.length && products.length > 8) {
    inserts[8] = (
      <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
        {midAds.slice(0, 2).map((ad, i) => <Box key={i} flex={1}><AdCard ad={ad} minH="150px" /></Box>)}
      </Flex>
    );
  }
  const total = meta?.total ?? products.length;

  return (
    <Page py={{ base: 5, md: 8 }}>
      <Breadcrumb fontSize="sm" color="ink.500" mb={3} separator="›">
        <BreadcrumbItem><BreadcrumbLink as={NextLink} href="/">Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbItem><BreadcrumbLink as={NextLink} href="/shop">Shop</BreadcrumbLink></BreadcrumbItem>
        {category && <BreadcrumbItem isCurrentPage><BreadcrumbLink>{category.name}</BreadcrumbLink></BreadcrumbItem>}
      </Breadcrumb>

      <Flex justify="space-between" align={{ md: 'end' }} direction={{ base: 'column', md: 'row' }} gap={4} mb={5}>
        <Box>
          <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }}>{emoji && <Text as="span" mr={2} aria-hidden="true">{emoji}</Text>}{title}</Heading>
          {subtitle && <Text color="ink.600" mt={1} maxW="640px">{subtitle}</Text>}
        </Box>
        <Text color="ink.500" fontWeight={600} flexShrink={0}>{pluralize(total, 'medicine')}{query ? ` for “${query}”` : ''}</Text>
      </Flex>

      {topAds[0] && !query && <Box mb={6}><AdCard ad={topAds[0]} minH="140px" priority /></Box>}

      <Flex gap={7} align="flex-start">
        <FilterSidebar categories={filters?.categories || []} brands={filters?.brands || []} activeCategory={category?.slug} />
        <Box flex={1} minW={0}>
          <Flex gap={3} mb={5} align="center">
            <Box display={{ base: 'block', lg: 'none' }}><FilterDrawerButton categories={filters?.categories || []} brands={filters?.brands || []} activeCategory={category?.slug} /></Box>
            <Box flex={{ base: 1, lg: 'none' }} ml={{ lg: 'auto' }}><SortSelect /></Box>
          </Flex>

          {products.length ? (
            <>
              <ProductGrid products={products} inserts={inserts} columns={{ base: 2, md: 3, xl: 4 }} />
              <Pagination page={meta?.page || 1} pages={meta?.pages || 1} />
            </>
          ) : (
            <EmptyState icon="search" title={failed ? 'We couldn’t load medicines' : 'No medicines found'}
              text={failed ? 'Check your connection and refresh the page.' : 'Try a different spelling, the generic name, or fewer filters. Can’t find it? A pharmacist can source it for you.'}>
              <HStack>
                <Button as={NextLink} href="/shop" variant="outline">Clear search</Button>
                {!failed && <Button as="a" href={wa(`Hello 👋 I’m looking for ${query || 'a medicine'} but couldn’t find it on your site.`)} target="_blank" rel="noopener noreferrer" variant="wa" leftIcon={<WhatsAppIcon size={18} />}>Ask on WhatsApp</Button>}
              </HStack>
            </EmptyState>
          )}
        </Box>
      </Flex>
    </Page>
  );
}
