'use client';
import { HStack, IconButton, Text } from '@chakra-ui/react';
import Icon from './Icon';

export default function QuantityStepper({ value, onChange, onRemove, min = 1, max = 99, size = 'md', isDisabled }) {
  const sm = size === 'sm';
  const dim = sm ? '34px' : '44px';
  const atMin = value <= min;
  const showTrash = onRemove && value <= 1;
  return (
    <HStack spacing={0} display="inline-flex" bg="white" border="1px solid" borderColor="ink.200" borderRadius="full" p="2px" role="group" aria-label="Quantity">
      <IconButton
        aria-label={showTrash ? 'Remove item' : 'Decrease quantity'}
        icon={<Icon name={showTrash ? 'trash' : 'minus'} size={sm ? 16 : 18} />}
        onClick={() => (showTrash ? onRemove() : onChange(value - 1))}
        isDisabled={isDisabled || (!showTrash && atMin)}
        variant="ghost" borderRadius="full" w={dim} h={dim} minW={dim} color={showTrash ? 'coral.600' : 'pine.800'} />
      <Text minW="2.2ch" px={1} textAlign="center" fontWeight={800} fontSize={sm ? 'sm' : 'md'} aria-live="polite">{value}</Text>
      <IconButton
        aria-label="Increase quantity" icon={<Icon name="add" size={sm ? 16 : 18} />}
        onClick={() => onChange(value + 1)} isDisabled={isDisabled || value >= max}
        variant="ghost" borderRadius="full" w={dim} h={dim} minW={dim} color="pine.800" />
    </HStack>
  );
}
