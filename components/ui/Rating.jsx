'use client';
import { HStack, Text } from '@chakra-ui/react';
import Icon from './Icon';

export default function Rating({ value = 0, count, size = 16, showValue = true }) {
  const full = Math.round(value);
  return (
    <HStack spacing={1} aria-label={`Rated ${value} out of 5`}>
      <HStack spacing={0.5} color="gold.500">
        {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={size} variant={i <= full ? 'Bold' : 'Linear'} color={i <= full ? '#F5A800' : '#B3C2B9'} />)}
      </HStack>
      {showValue && value > 0 && <Text fontSize="sm" fontWeight={700}>{Number(value).toFixed(1)}</Text>}
      {count !== undefined && <Text fontSize="sm" color="ink.500">({count})</Text>}
    </HStack>
  );
}
