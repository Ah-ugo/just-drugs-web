'use client';
import { HStack, IconButton, Text } from '@chakra-ui/react';
import Icon from './Icon';

export default function QuantityStepper({
  value,
  onChange,
  onRemove,
  min = 1,
  max = 99,
  size = 'md',
  isDisabled,
  ...rest
}) {
  const isXs = size === 'xs';
  const sm = size === 'sm' || isXs;
  const dim = isXs ? { base: '26px', md: '28px' } : sm ? { base: '28px', md: '34px' } : '44px';
  const iconSize = isXs ? 13 : sm ? 14 : 18;
  const atMin = value <= min;
  const showTrash = onRemove && value <= 1;

  return (
    <HStack
      spacing={0}
      display="inline-flex"
      bg="white"
      border="1px solid"
      borderColor="ink.200"
      borderRadius="full"
      p="2px"
      role="group"
      aria-label="Quantity"
      {...rest}
    >
      <IconButton
        aria-label={showTrash ? 'Remove item' : 'Decrease quantity'}
        icon={<Icon name={showTrash ? 'trash' : 'minus'} size={iconSize} />}
        onClick={() => (showTrash ? onRemove() : onChange(value - 1))}
        isDisabled={isDisabled || (!showTrash && atMin)}
        variant="ghost"
        borderRadius="full"
        w={dim}
        h={dim}
        minW={dim}
        color={showTrash ? 'coral.600' : 'pine.800'}
      />
      <Text
        minW={isXs ? '1.8ch' : '2.2ch'}
        px={1}
        textAlign="center"
        fontWeight={800}
        fontSize={isXs ? 'xs' : sm ? { base: 'xs', md: 'sm' } : 'md'}
        aria-live="polite"
      >
        {value}
      </Text>
      <IconButton
        aria-label="Increase quantity"
        icon={<Icon name="add" size={iconSize} />}
        onClick={() => onChange(value + 1)}
        isDisabled={isDisabled || value >= max}
        variant="ghost"
        borderRadius="full"
        w={dim}
        h={dim}
        minW={dim}
        color="pine.800"
      />
    </HStack>
  );
}
