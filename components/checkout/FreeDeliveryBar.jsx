'use client';
import { Box, HStack, Progress, Text } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { money } from '@/lib/format';
import { useStore } from '@/context/StoreContext';

export default function FreeDeliveryBar({ subtotal }) {
  const { freeThreshold } = useStore();
  if (!subtotal || !Number.isFinite(freeThreshold) || freeThreshold <= 0) return null;
  const left = Math.max(0, freeThreshold - subtotal);
  return (
    <Box bg="pine.50" borderRadius="xl" p={3}>
      <HStack spacing={2} mb={2} color="pine.700">
        <Icon name="truck" size={18} />
        <Text fontSize="sm" fontWeight={700}>
          {left > 0 ? <>Add {money(left)} more for <b>free delivery</b></> : 'You’ve unlocked free delivery 🎉'}
        </Text>
      </HStack>
      <Progress value={Math.min(100, (subtotal / freeThreshold) * 100)} size="xs" borderRadius="full" colorScheme="pine" bg="pine.100" />
    </Box>
  );
}
