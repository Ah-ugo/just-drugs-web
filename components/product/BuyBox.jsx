'use client';
import { useState } from 'react';
import { Alert, AlertIcon, Box, Button, Divider, HStack, IconButton, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import Price from '@/components/ui/Price';
import QuantityStepper from '@/components/ui/QuantityStepper';
import ShareMenu from './ShareMenu';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { stockInfo, priceInfo, productUrl } from '@/lib/product';
import { money } from '@/lib/format';
import { siteOrigin } from '@/lib/config';
import { productOrderMessage } from '@/lib/whatsapp';

export default function BuyBox({ product }) {
  const { add, getQty, animatingId } = useCart();
  const wl = useWishlist();
  const { wa, freeThreshold, prescriptionsEnabled } = useStore();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const id = product._id;
  const s = stockInfo(product);
  const p = priceInfo(product);
  const inCart = getQty(id);
  const saved = wl.has(id);
  const max = Math.max(1, s.max);
  const isBouncing = animatingId === id;
  // Derived purely from product data — safe for SSR (no localStorage)
  const isRxProduct = !!product.requires_prescription;

  const waHref = wa(productOrderMessage({
    product, qty, origin: siteOrigin(),
    customer: user ? { name: `${user.first_name} ${user.last_name}`, phone: user.phone } : null,
  }));

  // add() handles the prescription gate internally — opens modal if Rx not uploaded
  const handleAction = () => {
    add(product, qty, { openDrawer: true });
  };

  return (
    <>
      <VStack align="stretch" spacing={5}>
        <Price product={product} size="lg" showBadge />

        <HStack spacing={2} color={s.out ? 'coral.600' : s.low ? 'orange.600' : 'pine.600'} fontWeight={700}>
          <Icon name={s.out ? 'close' : 'check'} size={20} variant="Bold" />
          <Text>{s.out ? 'Out of stock' : s.low ? `Only ${s.qty} left — order soon` : 'In stock'}</Text>
        </HStack>

        {isRxProduct && (
          <Alert status="warning" borderRadius="xl" alignItems="start" bg="gold.50" color="pine.900">
            <AlertIcon color="gold.600" mt={1} />
            <Box>
              <Text fontWeight={800}>Prescription required</Text>
              <Text fontSize="sm">
                {prescriptionsEnabled
                  ? 'Upload your prescription to add this medicine to your cart, or order directly on WhatsApp.'
                  : 'Send a photo of your prescription on WhatsApp and a pharmacist will confirm your order.'}
              </Text>
            </Box>
          </Alert>
        )}

        {!s.out && (
          <HStack spacing={3} align="center">
            <Text fontWeight={700} color="ink.600">Quantity</Text>
            <QuantityStepper value={qty} min={1} max={max} onChange={setQty} />
          </HStack>
        )}

        <VStack align="stretch" spacing={3} display={{ base: 'none', md: 'flex' }}>
          {!s.out && (
            <Button
              variant="buy"
              size="lg"
              transform={isBouncing ? 'scale(1.05)' : 'scale(1)'}
              transition="transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              onClick={handleAction}
              leftIcon={<Icon name={isRxProduct ? 'doc' : 'cart'} size={20} />}
            >
              {isRxProduct ? `Upload Rx & add · ${money(p.current * qty)}` : `Add to cart · ${money(p.current * qty)}`}
            </Button>
          )}
          <Button as="a" href={waHref} target="_blank" rel="noopener noreferrer" variant="wa" size="lg" leftIcon={<WhatsAppIcon size={22} />}>
            {s.out ? 'Ask about restock on WhatsApp' : 'Order on WhatsApp'}
          </Button>
        </VStack>

        <HStack spacing={3}>
          <Button variant="outline" size="md" onClick={() => wl.toggle(product)} aria-pressed={saved}
            leftIcon={<Icon name="heart" size={18} variant={saved ? 'Bold' : 'Linear'} color={saved ? '#E5503F' : 'currentColor'} />}>
            {saved ? 'Saved' : 'Save'}
          </Button>
          <ShareMenu product={product} size="md" />
          {inCart > 0 && <Text fontSize="sm" color="pine.600" fontWeight={700} ml="auto">{inCart} in your cart</Text>}
        </HStack>

        <Divider />
        <VStack align="stretch" spacing={3} fontSize="sm" color="ink.700">
          <HStack spacing={3}><Icon name="truck" size={20} /><Text>Free delivery on orders from {money(freeThreshold)}</Text></HStack>
          <HStack spacing={3}><Icon name="shield" size={20} /><Text>Secure checkout with Paystack — card, bank transfer or USSD</Text></HStack>
          <HStack spacing={3}><Icon name="support" size={20} /><Text>Questions? A pharmacist is one WhatsApp message away</Text></HStack>
        </VStack>
      </VStack>

      {/* Mobile sticky buy bar, sits above the bottom navigation */}
      <HStack className="no-print" display={{ base: 'flex', md: 'none' }} position="fixed" left={0} right={0} zIndex={46}
        bottom="calc(60px + env(safe-area-inset-bottom))" bg="white" px={3} py={2.5} spacing={2.5} boxShadow="bar" borderTop="1px solid" borderColor="ink.100">
        <IconButton as="a" href={waHref} target="_blank" rel="noopener noreferrer" aria-label="Order on WhatsApp" icon={<WhatsAppIcon size={24} />} variant="wa" h="48px" w="48px" minW="48px" />
        {s.out ? (
          <Button flex={1} h="48px" variant="outline" isDisabled>Out of stock</Button>
        ) : (
          <Button
            flex={1}
            h="48px"
            variant="buy"
            transform={isBouncing ? 'scale(1.03)' : 'scale(1)'}
            transition="transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            onClick={handleAction}
            leftIcon={<Icon name={isRxProduct ? 'doc' : 'cart'} size={18} />}
          >
            {isRxProduct ? `Upload Rx · ${money(p.current * qty)}` : `Add to cart · ${money(p.current * qty)}`}
          </Button>
        )}
      </HStack>
    </>
  );
}
