'use client';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { fmtDateTime, statusInfo } from '@/lib/format';

export const TRACK_STEPS = [
  { key: 'preparing', label: 'Order confirmed', hint: 'We’re preparing your medicines' },
  { key: 'packed', label: 'Packed', hint: 'Checked and sealed by our team' },
  { key: 'assigned', label: 'Rider assigned', hint: 'A rider has been matched to your order' },
  { key: 'picked_up', label: 'Picked up', hint: 'Your rider has collected the package' },
  { key: 'out_for_delivery', label: 'Out for delivery', hint: 'On the way to you' },
  { key: 'delivered', label: 'Delivered', hint: 'Enjoy — and get well soon' },
];

export default function DeliveryTimeline({ status, history = [] }) {
  const cur = Math.max(0, statusInfo(status).step); // 0 = nothing yet
  const when = {};
  history.forEach((h) => { when[h.status] = h.timestamp; });
  return (
    <VStack align="stretch" spacing={0} as="ol" listStyleType="none">
      {TRACK_STEPS.map((s, i) => {
        const done = i + 1 < cur || (status === 'delivered' && i + 1 <= cur);
        const active = i + 1 === cur && status !== 'delivered';
        return (
          <Flex as="li" key={s.key} gap={4} pb={i === TRACK_STEPS.length - 1 ? 0 : 6} position="relative">
            {i < TRACK_STEPS.length - 1 && <Box position="absolute" left="15px" top="32px" bottom="0" w="2px" bg={done ? 'pine.400' : 'ink.200'} />}
            <Flex w="32px" h="32px" borderRadius="full" align="center" justify="center" flexShrink={0} zIndex={1}
              bg={done ? 'pine.500' : active ? 'gold.400' : 'white'} color={done ? 'white' : 'pine.900'} border="2px solid" borderColor={done ? 'pine.500' : active ? 'gold.500' : 'ink.200'}>
              {done ? <Icon name="check" size={18} variant="Bold" /> : active ? <Box w="10px" h="10px" borderRadius="full" bg="pine.900" /> : null}
            </Flex>
            <Box>
              <Text fontWeight={800} color={done || active ? 'pine.900' : 'ink.400'}>{s.label}</Text>
              <Text fontSize="sm" color={done || active ? 'ink.600' : 'ink.400'}>{when[s.key] ? fmtDateTime(when[s.key]) : active ? s.hint : done ? '' : s.hint}</Text>
            </Box>
          </Flex>
        );
      })}
    </VStack>
  );
}
