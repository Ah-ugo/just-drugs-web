'use client';
import NextLink from 'next/link';
import { Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, HStack, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import ProductImage from '@/components/ui/ProductImage';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { EmptyState } from '@/components/ui/Layout';
import FreeDeliveryBar from '@/components/checkout/FreeDeliveryBar';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { money } from '@/lib/format';
import { cartOrderMessage } from '@/lib/whatsapp';
import { siteOrigin } from '@/lib/config';
import { productUrl } from '@/lib/product';

export default function CartDrawer() {
  const { drawer, items, subtotal, count, requiresRx, setQty, remove } = useCart();
  const { wa } = useStore();
  const { user } = useAuth();
  const msg = cartOrderMessage({ items, subtotal, requiresRx, origin: siteOrigin(), customer: user ? { name: `${user.first_name} ${user.last_name}`, phone: user.phone } : null });

  return (
    <Drawer isOpen={drawer.isOpen} placement="right" onClose={drawer.onClose}>
      <DrawerOverlay />
      <DrawerContent maxW={{ base: '92vw', sm: '420px' }} w="100%">
        <DrawerCloseButton top={4} />
        <DrawerHeader fontFamily="heading" fontSize="2xl" color="pine.900">Your cart {count > 0 && <Text as="span" color="ink.400" fontSize="lg">({count})</Text>}</DrawerHeader>
        <DrawerBody px={{ base: 4, sm: 5 }} py={2}>
          {items.length === 0 ? (
            <EmptyState icon="cart" title="Your cart is empty" text="Add medicines and they’ll show up here.">
              <Button as={NextLink} href="/shop" variant="buy" onClick={drawer.onClose}>Start shopping</Button>
            </EmptyState>
          ) : (
            <VStack align="stretch" spacing={4} divider={<Box borderBottom="1px solid" borderColor="ink.100" />}>
              {items.map((it) => (
                <HStack key={it.product_id} align="start" spacing={3}>
                  <ProductImage product={{ name: it.product_name }} src={it.image_url} width={160} w="64px" flexShrink={0} rounded="lg" />
                  <Box flex={1} minW={0}>
                    <Text as={NextLink} href={productUrl(it.slug)} onClick={drawer.onClose} fontWeight={700} fontSize="sm" noOfLines={2} lineHeight={1.3}>{it.product_name}</Text>
                    {it.requires_prescription && <Text fontSize="xs" color="coral.600" fontWeight={700}>Prescription required</Text>}
                    {!it.stock_valid && <Text fontSize="xs" color="coral.600">Only {it.available_stock} left in stock</Text>}
                    <HStack justify="space-between" mt={2}>
                      <QuantityStepper size="sm" value={it.quantity} max={it.available_stock || 99} onChange={(q) => setQty(it.product_id, q)} onRemove={() => remove(it.product_id)} />
                      <Text fontWeight={800} fontFamily="heading" fontSize="sm">{money(it.total_price)}</Text>
                    </HStack>
                  </Box>
                </HStack>
              ))}
              <FreeDeliveryBar subtotal={subtotal} />
            </VStack>
          )}
        </DrawerBody>
        {items.length > 0 && (
          <DrawerFooter flexDirection="column" gap={3} borderTop="1px solid" borderColor="ink.100" alignItems="stretch" px={{ base: 4, sm: 5 }} pt={4} pb="max(16px, env(safe-area-inset-bottom))">
            <HStack justify="space-between"><Text color="ink.600">Subtotal</Text><Text fontFamily="heading" fontWeight={800} fontSize="xl">{money(subtotal)}</Text></HStack>
            <Button as={NextLink} href="/checkout" variant="buy" size="md" w="full" onClick={drawer.onClose} rightIcon={<Icon name="right" size={18} />}>Checkout</Button>
            <HStack>
              <Button as={NextLink} href="/cart" variant="outline" size="sm" flex={1} onClick={drawer.onClose}>View cart</Button>
              <Button as="a" href={wa(msg)} target="_blank" rel="noopener noreferrer" variant="wa" size="sm" flex={1} leftIcon={<WhatsAppIcon size={16} />}>WhatsApp</Button>
            </HStack>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
