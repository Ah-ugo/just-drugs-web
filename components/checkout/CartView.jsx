'use client';
import NextLink from 'next/link';
import { Alert, AlertIcon, Box, Button, Flex, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import ProductImage from '@/components/ui/ProductImage';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { EmptyState, Page } from '@/components/ui/Layout';
import { Heading } from '@chakra-ui/react';
import OrderSummary, { useTotals } from './OrderSummary';
import CouponBox from './CouponBox';
import FreeDeliveryBar from './FreeDeliveryBar';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useCoupon } from '@/lib/coupon';
import { money } from '@/lib/format';
import { productUrl } from '@/lib/product';
import { cartOrderMessage } from '@/lib/whatsapp';
import { siteOrigin } from '@/lib/config';

export default function CartView() {
  const { items, subtotal, requiresRx, setQty, remove, ready } = useCart();
  const { wa, prescriptionsEnabled } = useStore();
  const { user } = useAuth();
  const { coupon, apply, remove: removeCoupon } = useCoupon();
  const totals = useTotals(subtotal, coupon);
  const blocked = items.some((i) => !i.stock_valid);

  if (ready && items.length === 0) {
    return (
      <Page py={8}>
        <EmptyState icon="cart" title="Your cart is empty" text="Find what you need and add it here. You can also order by sending us a WhatsApp message.">
          <HStack><Button as={NextLink} href="/shop" variant="buy">Shop medicines</Button>
            <Button as="a" href={wa('Hello 👋 I’d like to order some medicines.')} target="_blank" rel="noopener noreferrer" variant="wa" leftIcon={<WhatsAppIcon size={18} />}>WhatsApp</Button></HStack>
        </EmptyState>
      </Page>
    );
  }

  const msg = cartOrderMessage({ items, subtotal, requiresRx, origin: siteOrigin(), customer: user ? { name: `${user.first_name} ${user.last_name}`, phone: user.phone } : null });

  return (
    <Page py={{ base: 5, md: 10 }}>
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }} mb={6}>Your cart</Heading>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 400px' }} gap={{ base: 6, lg: 8 }} alignItems="start">
        <VStack align="stretch" spacing={3}>
          {items.map((it) => (
            <Flex key={it.product_id} gap={4} bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={{ base: 3, md: 4 }}>
              <ProductImage product={{ name: it.product_name }} src={it.image_url} width={240} w={{ base: '84px', md: '110px' }} flexShrink={0} rounded="xl" />
              <Flex flex={1} direction="column" minW={0} gap={2}>
                <Text as={NextLink} href={productUrl(it.slug)} fontWeight={700} fontSize={{ md: 'lg' }} noOfLines={2} lineHeight={1.3}>{it.product_name}</Text>
                <Text color="ink.500" fontSize="sm">{money(it.unit_price)} each</Text>
                {it.requires_prescription && <HStack spacing={1} color="coral.600" fontSize="sm" fontWeight={700}><Icon name="doc" size={15} /><Text>Prescription required</Text></HStack>}
                {!it.stock_valid && <Text fontSize="sm" color="coral.600" fontWeight={700}>Only {it.available_stock} left — please reduce the quantity</Text>}
                <Flex justify="space-between" align="center" mt="auto" gap={2} flexWrap="wrap">
                  <QuantityStepper value={it.quantity} max={it.available_stock || 99} onChange={(q) => setQty(it.product_id, q)} onRemove={() => remove(it.product_id)} />
                  <Text fontFamily="heading" fontWeight={800} fontSize="xl">{money(it.total_price)}</Text>
                </Flex>
              </Flex>
            </Flex>
          ))}
          <FreeDeliveryBar subtotal={subtotal} />
        </VStack>

        <VStack align="stretch" spacing={4} position={{ lg: 'sticky' }} top={{ lg: '130px' }}>
          {requiresRx && (
            <Alert status="warning" borderRadius="xl" bg="gold.50" alignItems="start">
              <AlertIcon color="gold.600" mt={1} />
              <Box fontSize="sm"><Text fontWeight={800}>Prescription needed</Text>
                {prescriptionsEnabled ? <>Some items need an approved prescription. <Text as={NextLink} href="/prescriptions" fontWeight={700} textDecoration="underline">Upload it here</Text> or send a photo on WhatsApp.</> : 'Send a photo of your prescription on WhatsApp to complete this order.'}
              </Box>
            </Alert>
          )}
          <OrderSummary totals={totals} couponCode={coupon?.code}>
            <Box mt={4}><CouponBox subtotal={subtotal} coupon={coupon} onApply={(c) => apply(c, subtotal)} onRemove={removeCoupon} /></Box>
            <VStack align="stretch" spacing={3} mt={5}>
              <Button as={NextLink} href="/checkout" variant="buy" size="lg" isDisabled={blocked} rightIcon={<Icon name="right" size={18} />}>Checkout · {money(totals.total)}</Button>
              <Button as="a" href={wa(msg)} target="_blank" rel="noopener noreferrer" variant="wa" size="lg" leftIcon={<WhatsAppIcon size={22} />}>Order on WhatsApp</Button>
              <Button as={NextLink} href="/invoice/proforma" variant="ghost" size="sm" leftIcon={<Icon name="receipt" size={18} />}>Get a proforma invoice</Button>
            </VStack>
          </OrderSummary>
          <Text fontSize="xs" color="ink.500" textAlign="center">Delivery and VAT are calculated at checkout from our current rates.</Text>
        </VStack>
      </Grid>
    </Page>
  );
}
