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
    <LinkBox
      as="article"
      bg="white"
      borderRadius={{ base: 'xl', md: '2xl' }}
      overflow="hidden"
      border="1px solid"
      borderColor="ink.100"
      boxShadow={{ base: '0 1px 3px rgba(7,43,31,.04)', md: 'soft' }}
      display="flex"
      flexDirection="column"
      transition="box-shadow .2s, border-color .2s, transform .2s"
      _hover={{ boxShadow: 'lift', borderColor: 'pine.200' }}
    >
      <Box position="relative">
        <ProductImage product={product} width={480} priority={priority} />
        {p.onSale && (
          <Badge
            position="absolute"
            top={{ base: 2, md: 3 }}
            left={{ base: 2, md: 3 }}
            bg="coral.500"
            color="white"
            fontSize={{ base: '2xs', md: 'xs' }}
            fontWeight={800}
            px={{ base: 1.5, md: 2.5 }}
            py={{ base: 0.5, md: 1 }}
            borderRadius="md"
          >
            −{p.percent}%
          </Badge>
        )}
        <IconButton
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={saved}
          icon={
            <Icon
              name="heart"
              size={16}
              variant={saved ? 'Bold' : 'Linear'}
              color={saved ? '#E5503F' : '#35443D'}
            />
          }
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            wl.toggle(product);
          }}
          position="absolute"
          top={{ base: 2, md: 2.5 }}
          right={{ base: 2, md: 2.5 }}
          size="sm"
          w={{ base: '30px', md: '36px' }}
          h={{ base: '30px', md: '36px' }}
          minW={{ base: '30px', md: '36px' }}
          borderRadius="full"
          bg="whiteAlpha.900"
          boxShadow="soft"
          zIndex={2}
          _hover={{ bg: 'white', transform: 'scale(1.08)' }}
          _active={{ transform: 'scale(0.92)' }}
        />
        {s.low && !s.out && (
          <Badge
            position="absolute"
            bottom={{ base: 2, md: 3 }}
            left={{ base: 2, md: 3 }}
            colorScheme="orange"
            variant="solid"
            fontSize={{ base: '2xs', md: 'xs' }}
            px={{ base: 1.5, md: 2 }}
            py={{ base: 0.5, md: 0.5 }}
            borderRadius="md"
          >
            Only {s.qty} left
          </Badge>
        )}
      </Box>

      <Box
        p={{ base: 2.5, sm: 3, md: 4 }}
        display="flex"
        flexDirection="column"
        flex={1}
        gap={{ base: 1, md: 1.5 }}
      >
        {product.brand_name && (
          <Text
            fontSize={{ base: '2xs', md: 'xs' }}
            fontWeight={700}
            color="pine.600"
            textTransform="uppercase"
            letterSpacing="0.04em"
            noOfLines={1}
          >
            {product.brand_name}
          </Text>
        )}
        <LinkOverlay
          as={NextLink}
          href={productUrl(product.slug)}
          fontWeight={700}
          fontSize={{ base: '13px', sm: 'sm', md: 'md' }}
          lineHeight={{ base: 1.25, md: 1.3 }}
          noOfLines={2}
          minH={{ base: '2.5em', md: '2.6em' }}
          color="ink.900"
          _hover={{ color: 'pine.600' }}
        >
          {product.name}
        </LinkOverlay>
        {meta && (
          <Text fontSize={{ base: '2xs', sm: 'xs', md: 'sm' }} color="ink.500" noOfLines={1}>
            {meta}
          </Text>
        )}
        {product.requires_prescription && (
          <HStack spacing={1} color="coral.600" fontSize={{ base: '2xs', md: 'xs' }} fontWeight={700} minH="1.2em">
            <Icon name="doc" size={12} flexShrink={0} />
            <Text noOfLines={1}>Rx required</Text>
          </HStack>
        )}
        <Box mt="auto" pt={{ base: 1.5, md: 2 }}>
          <Price product={product} size="md" />
        </Box>

        <Box position="relative" zIndex={2} mt={{ base: 1.5, md: 2 }}>
          {s.out ? (
            <Button
              as="a"
              href={wa(
                `Hello 👋 Is *${product.name}* available? Please let me know when it’s back in stock.\n${siteOrigin()}${productUrl(product.slug)}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="sm"
              h={{ base: '32px', md: '40px' }}
              fontSize={{ base: 'xs', md: 'sm' }}
              px={{ base: 2, md: 3 }}
              w="full"
              leftIcon={<WhatsAppIcon size={14} />}
            >
              <Text as="span" display={{ base: 'none', sm: 'inline' }}>Ask when it’s back</Text>
              <Text as="span" display={{ base: 'inline', sm: 'none' }}>Ask in stock</Text>
            </Button>
          ) : qty > 0 ? (
            <HStack
              justify={{ base: 'center', sm: 'space-between' }}
              align="center"
              w="full"
              transform={isBouncing ? 'scale(1.05)' : 'scale(1)'}
              transition="transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            >
              <QuantityStepper
                size="sm"
                value={qty}
                max={s.max}
                onChange={(q) => setQty(id, q)}
                onRemove={() => remove(id)}
              />
              <Text display={{ base: 'none', sm: 'block' }} fontSize="xs" color="pine.600" fontWeight={700}>
                In cart
              </Text>
            </HStack>
          ) : (
            <Button
              variant={isRxProduct ? 'outline' : 'buy'}
              borderColor={isRxProduct ? 'pine.400' : undefined}
              size="sm"
              h={{ base: '32px', md: '40px' }}
              fontSize={{ base: 'xs', md: 'sm' }}
              px={{ base: 2, md: 4 }}
              w="full"
              transform={isBouncing ? 'scale(1.06)' : 'scale(1)'}
              transition="transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              onClick={() => add(product, 1)}
              leftIcon={
                <Icon
                  name={isRxProduct ? 'doc' : 'cart'}
                  size={isRxProduct ? 14 : 16}
                  color={isRxProduct ? '#1B7F5A' : undefined}
                />
              }
              _hover={isRxProduct ? { bg: 'pine.50', borderColor: 'pine.600' } : undefined}
            >
              {isRxProduct ? (
                <>
                  <Text as="span" display={{ base: 'none', sm: 'inline' }}>Upload Rx & add</Text>
                  <Text as="span" display={{ base: 'inline', sm: 'none' }}>Upload Rx</Text>
                </>
              ) : (
                'Add to cart'
              )}
            </Button>
          )}
        </Box>
      </Box>
    </LinkBox>
  );
}
