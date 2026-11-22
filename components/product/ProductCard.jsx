'use client';
import NextLink from 'next/link';
import { Badge, Box, Button, HStack, IconButton, LinkBox, LinkOverlay, Text } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import ProductImage from '@/components/ui/ProductImage';
import Price from '@/components/ui/Price';
import QuantityStepper from '@/components/ui/QuantityStepper';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useStore } from '@/context/StoreContext';
import { priceInfo, productMeta, productUrl, stockInfo } from '@/lib/product';
import { siteOrigin } from '@/lib/config';

export default function ProductCard({ product, priority = false }) {
  const { add, getQty, setQty, remove, animatingId } = useCart();
  const wl = useWishlist();
  const { wa } = useStore();
  const id = product._id;
  const p = priceInfo(product);
  const s = stockInfo(product);
  const qty = getQty(id);
  const saved = wl.has(id);
  const meta = productMeta(product);
  const isBouncing = animatingId === id;
  // Prescription check is deferred to click handler to avoid SSR/client mismatch
  const isRxProduct = !!product.requires_prescription;

  return (
    <LinkBox as="article" bg="white" borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="ink.100"
      display="flex" flexDirection="column" transition="box-shadow .2s, border-color .2s, transform .2s"
      _hover={{ boxShadow: 'lift', borderColor: 'pine.200' }}>
      <Box position="relative">
        <ProductImage product={product} width={480} priority={priority} />
        {p.onSale && <Badge position="absolute" top={3} left={3} bg="coral.500" color="white" px={2.5} py={1}>−{p.percent}%</Badge>}
        <IconButton aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={saved}
          icon={<Icon name="heart" size={19} variant={saved ? 'Bold' : 'Linear'} color={saved ? '#E5503F' : '#35443D'} />}
          onClick={() => wl.toggle(product)} position="absolute" top={2.5} right={2.5} size="sm" borderRadius="full" bg="whiteAlpha.900" boxShadow="soft" zIndex={2} _hover={{ bg: 'white' }} />
        {s.low && !s.out && <Badge position="absolute" bottom={3} left={3} colorScheme="orange" variant="solid">Only {s.qty} left</Badge>}
      </Box>

      <Box p={{ base: 3, md: 4 }} display="flex" flexDirection="column" flex={1} gap={1.5}>
        {product.brand_name && <Text fontSize="xs" fontWeight={700} color="pine.500" noOfLines={1}>{product.brand_name}</Text>}
        <LinkOverlay as={NextLink} href={productUrl(product.slug)} fontWeight={700} lineHeight={1.3} noOfLines={2} minH="2.6em">{product.name}</LinkOverlay>
        {meta && <Text fontSize="sm" color="ink.500" noOfLines={1}>{meta}</Text>}
        {product.requires_prescription && (
          <HStack spacing={1} color="coral.600" fontSize="xs" fontWeight={700}><Icon name="doc" size={14} /><Text>Prescription required</Text></HStack>
        )}
        <Box mt="auto" pt={2}><Price product={product} size="md" /></Box>

        <Box position="relative" zIndex={2} mt={2}>
          {s.out ? (
            <Button as="a" href={wa(`Hello 👋 Is *${product.name}* available? Please let me know when it’s back in stock.\n${siteOrigin()}${productUrl(product.slug)}`)}
              target="_blank" rel="noopener noreferrer" variant="outline" size="sm" w="full" leftIcon={<WhatsAppIcon size={16} />}>Ask when it’s back</Button>
          ) : qty > 0 ? (
            <HStack justify="space-between" transform={isBouncing ? 'scale(1.05)' : 'scale(1)'} transition="transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)">
              <QuantityStepper size="sm" value={qty} max={s.max} onChange={(q) => setQty(id, q)} onRemove={() => remove(id)} />
              <Text fontSize="xs" color="pine.600" fontWeight={700}>In cart</Text>
            </HStack>
          ) : (
            <Button
              variant={isRxProduct ? 'outline' : 'buy'}
              borderColor={isRxProduct ? 'pine.400' : undefined}
              size="sm"
              w="full"
              transform={isBouncing ? 'scale(1.06)' : 'scale(1)'}
              transition="transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              onClick={() => add(product, 1)}
              leftIcon={<Icon name={isRxProduct ? 'doc' : 'cart'} size={isRxProduct ? 16 : 17} color={isRxProduct ? '#1B7F5A' : undefined} />}
              _hover={isRxProduct ? { bg: 'pine.50', borderColor: 'pine.600' } : undefined}
            >
              {isRxProduct ? 'Upload Rx & add' : 'Add to cart'}
            </Button>
          )}
        </Box>
      </Box>
    </LinkBox>
  );
}
