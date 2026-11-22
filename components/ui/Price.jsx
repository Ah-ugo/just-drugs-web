'use client';
import { Badge, HStack, Text } from '@chakra-ui/react';
import { money } from '@/lib/format';
import { priceInfo } from '@/lib/product';

const SIZES = { sm: ['md', 'xs'], md: ['xl', 'sm'], lg: ['3xl', 'md'] };

export default function Price({ product, size = 'md', showBadge = false }) {
  const p = priceInfo(product);
  const [main, old] = SIZES[size] || SIZES.md;
  return (
    <HStack spacing={2} align="baseline" flexWrap="wrap">
      <Text fontFamily="heading" fontWeight={800} fontSize={main} color="pine.900" letterSpacing="-0.03em" lineHeight={1.1}>
        {money(p.current)}
      </Text>
      {p.old && <Text as="s" fontSize={old} color="ink.400" fontWeight={500}>{money(p.old)}</Text>}
      {showBadge && p.onSale && <Badge colorScheme="coral" variant="solid">Save {p.percent}%</Badge>}
    </HStack>
  );
}
