'use client';
import { Badge, HStack, Text } from '@chakra-ui/react';
import { money } from '@/lib/format';
import { priceInfo } from '@/lib/product';

const SIZES = {
  xs: { main: { base: 'xs', md: 'sm' }, old: '2xs' },
  sm: { main: { base: 'sm', md: 'md' }, old: { base: '2xs', md: 'xs' } },
  md: { main: { base: 'md', sm: 'lg', md: 'xl' }, old: { base: 'xs', md: 'sm' } },
  lg: { main: { base: 'xl', md: '3xl' }, old: { base: 'sm', md: 'md' } },
};

export default function Price({ product, size = 'md', showBadge = false }) {
  const p = priceInfo(product);
  const conf = SIZES[size] || SIZES.md;
  return (
    <HStack spacing={{ base: 1.5, md: 2 }} align="baseline" flexWrap="wrap">
      <Text fontFamily="heading" fontWeight={800} fontSize={conf.main} color="pine.900" letterSpacing="-0.03em" lineHeight={1.1}>
        {money(p.current)}
      </Text>
      {p.old && <Text as="s" fontSize={conf.old} color="ink.400" fontWeight={500}>{money(p.old)}</Text>}
      {showBadge && p.onSale && (
        <Badge colorScheme="coral" variant="solid" fontSize={{ base: '2xs', md: 'xs' }}>
          Save {p.percent}%
        </Badge>
      )}
    </HStack>
  );
}
