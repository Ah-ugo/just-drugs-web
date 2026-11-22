'use client';
import NextLink from 'next/link';
import { Box, Button, Flex, Grid, Heading, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import AdCard, { adsOf } from '@/components/ui/AdCard';
import { Page, SectionHeading, EmptyState } from '@/components/ui/Layout';
import Hero from './Hero';
import ProductRail from './ProductRail';
import { useStore } from '@/context/StoreContext';
import { money } from '@/lib/format';

const Section = ({ children, ...r }) => <Page mt={{ base: 10, md: 16 }} {...r}>{children}</Page>;

function Quick({ href, icon, title, text, external }) {
  const props = external ? { as: 'a', href, target: '_blank', rel: 'noopener noreferrer' } : { as: NextLink, href };
  return (
    <HStack {...props} spacing={3.5} bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={4} _hover={{ borderColor: 'pine.300', boxShadow: 'soft', textDecoration: 'none' }} transition="all .2s">
      <Flex w="46px" h="46px" borderRadius="full" bg="pine.50" color="pine.600" align="center" justify="center" flexShrink={0}>{icon}</Flex>
      <Box><Text fontWeight={800} lineHeight={1.2}>{title}</Text><Text fontSize="sm" color="ink.500">{text}</Text></Box>
    </HStack>
  );
}

export default function HomeView({ data }) {
  const { freeThreshold, prescriptionsEnabled, wa } = useStore();
  const on = (k) => (data.sections_enabled ? data.sections_enabled[k] !== false : true);
  const hero = adsOf(data.hero_carousel);
  const cats = data.categories || [];
  const mid = adsOf(data.banner_ads);
  const rails = [
    { key: 'discounted_products', title: 'Deals this week', sub: 'Marked-down prices on everyday health needs', href: '/shop?sort_by=price_low', list: data.discounted_products },
    { key: 'featured_products', title: 'Pharmacist picks', sub: 'Trusted essentials to keep at home', href: '/shop?featured=true', list: data.featured_products },
    { key: 'popular_products', title: 'Most popular', sub: 'What other customers buy most', href: '/shop?sort_by=popular', list: data.popular_products },
    { key: 'new_arrivals', title: 'New arrivals', sub: 'Just added to our shelves', href: '/shop?new_arrival=true', list: data.new_arrivals },
  ].filter((r) => on(r.key) && r.list?.length);

  const empty = !cats.length && !rails.length;

  return (
    <>
      <Hero ads={on('hero_carousel') ? hero : []} categories={cats} />

      <Page mt={{ base: 5, md: 8 }}>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
          {prescriptionsEnabled && <Quick href="/prescriptions" icon={<Icon name="upload" size={22} />} title="Upload prescription" text="Reviewed by a pharmacist" />}
          <Quick href={wa('Hello 👋 I’d like to order some medicines.')} external icon={<WhatsAppIcon size={22} />} title="Order on WhatsApp" text="Send your list, we reply fast" />
          <Quick href="/track" icon={<Icon name="truck" size={22} />} title="Track your order" text={`Free delivery over ${money(freeThreshold)}`} />
          <Quick href="/shop" icon={<Icon name="shield" size={22} />} title="Pay securely" text="Card, transfer or USSD via Paystack" />
        </SimpleGrid>
      </Page>

      {on('categories') && cats.length > 0 && (
        <Section>
          <SectionHeading title="Shop by need" href="/shop" linkLabel="All medicines" />
          <Grid templateColumns={{ base: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' }} gap={{ base: 3, md: 4 }}>
            {cats.map((c) => (
              <VStack key={c._id} as={NextLink} href={`/category/${c.slug}`} spacing={2} bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" py={{ base: 4, md: 5 }} px={2}
                _hover={{ borderColor: 'pine.300', boxShadow: 'soft', transform: 'translateY(-2px)', textDecoration: 'none' }} transition="all .2s">
                <Flex w={{ base: '52px', md: '60px' }} h={{ base: '52px', md: '60px' }} borderRadius="full" bg="pine.50" align="center" justify="center" fontSize={{ base: '26px', md: '30px' }} aria-hidden="true">{c.emoji || '💊'}</Flex>
                <Text fontWeight={700} fontSize={{ base: 'sm', md: 'md' }} textAlign="center" lineHeight={1.2}>{c.name}</Text>
              </VStack>
            ))}
          </Grid>
        </Section>
      )}

      {rails.slice(0, 2).map((r) => (
        <Section key={r.key}><SectionHeading title={r.title} subtitle={r.sub} href={r.href} /><ProductRail products={r.list} /></Section>
      ))}

      {on('prescription_cta') && prescriptionsEnabled && (
        <Section>
          <Flex bg="pine.800" color="white" borderRadius="3xl" p={{ base: 6, md: 10 }} gap={6} direction={{ base: 'column', md: 'row' }} align={{ md: 'center' }} justify="space-between" position="relative" overflow="hidden">
            <Box position="absolute" right="-60px" top="-60px" w="240px" h="240px" borderRadius="full" bg="pine.700" />
            <Box position="relative" maxW="620px">
              <Heading as="h2" color="white" fontSize={{ base: '2xl', md: '4xl' }}>Got a prescription? Skip the queue.</Heading>
              <Text mt={3} color="pine.100" fontSize={{ base: 'md', md: 'lg' }}>Snap a photo or upload a PDF. A pharmacist checks it, and your medicines are ready to order.</Text>
            </Box>
            <HStack position="relative" spacing={3} flexWrap="wrap">
              <Button as={NextLink} href="/prescriptions" variant="buy" size="lg" leftIcon={<Icon name="camera" size={20} />}>Upload prescription</Button>
              <Button as="a" href={wa('Hello 👋 I’d like to send my prescription.')} target="_blank" rel="noopener noreferrer" variant="wa" size="lg" leftIcon={<WhatsAppIcon size={22} />}>Send on WhatsApp</Button>
            </HStack>
          </Flex>
        </Section>
      )}

      {rails.slice(2).map((r, idx) => (
        <Section key={r.key}>
          <SectionHeading title={r.title} subtitle={r.sub} href={r.href} />
          <ProductRail products={r.list} />
          {idx === 0 && on('banner_ads') && mid.length > 0 && (
            <Flex mt={10} gap={4} direction={{ base: 'column', md: 'row' }}>
              {mid.slice(0, 2).map((ad, i) => <Box key={i} flex={1}><AdCard ad={ad} /></Box>)}
            </Flex>
          )}
        </Section>
      ))}

      <Section>
        <SectionHeading title="How ordering works" />
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          {[
            ['Find your medicine', 'Search by name or symptom, or upload your prescription.'],
            ['Pay or message us', 'Checkout with Paystack, or send your cart to us on WhatsApp.'],
            ['Track delivery', 'Follow your order from packing to your doorstep, and download your invoice.'],
          ].map(([t, d], i) => (
            <HStack key={t} align="start" spacing={4} bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={5}>
              <Flex w="38px" h="38px" borderRadius="full" bg="gold.400" color="pine.900" fontFamily="heading" fontWeight={800} align="center" justify="center" flexShrink={0}>{i + 1}</Flex>
              <Box><Text fontFamily="heading" fontWeight={800} fontSize="lg">{t}</Text><Text color="ink.600">{d}</Text></Box>
            </HStack>
          ))}
        </SimpleGrid>
      </Section>

      {empty && <EmptyState icon="shop" title="Our shelves are loading" text="We couldn’t reach the store just now. Please refresh in a moment, or order on WhatsApp.">
        <Button as="a" href={wa('Hello 👋 I’d like to order some medicines.')} target="_blank" rel="noopener noreferrer" variant="wa" leftIcon={<WhatsAppIcon size={18} />}>Order on WhatsApp</Button>
      </EmptyState>}
    </>
  );
}
