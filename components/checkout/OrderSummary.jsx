'use client';
import { Box, HStack, Text, VStack, Divider } from '@chakra-ui/react';
import { money } from '@/lib/format';
import { useStore } from '@/context/StoreContext';
import { calcTotals, couponDiscount } from '@/lib/pricing';

export function useTotals(subtotal, coupon) {
  const { deliveryFee, freeThreshold, taxRate } = useStore();
  return calcTotals({ subtotal, discount: couponDiscount(coupon, subtotal), deliveryFee, freeThreshold, taxRate });
}

const Row = ({ label, value, bold, good }) => (
  <HStack justify="space-between" fontWeight={bold ? 800 : 500} fontSize={bold ? 'xl' : 'md'} color={good ? 'pine.600' : undefined}>
    <Text color={bold ? 'pine.900' : 'ink.600'} fontFamily={bold ? 'heading' : undefined}>{label}</Text>
    <Text fontFamily={bold ? 'heading' : undefined} color={bold ? 'pine.900' : undefined}>{value}</Text>
  </HStack>
);

export default function OrderSummary({ totals, couponCode, children }) {
  const { taxName, taxRate } = useStore();
  return (
    <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={{ base: 4, md: 6 }}>
      <Text fontFamily="heading" fontWeight={800} fontSize="xl" mb={4}>Order summary</Text>
      <VStack align="stretch" spacing={2.5}>
        <Row label="Subtotal" value={money(totals.subtotal)} />
        {totals.discount > 0 && <Row label={`Coupon${couponCode ? ` (${couponCode})` : ''}`} value={`−${money(totals.discount)}`} good />}
        <Row label="Delivery" value={totals.delivery === 0 ? 'Free' : money(totals.delivery)} good={totals.delivery === 0} />
        <Row label={`${taxName} (${taxRate}%)`} value={money(totals.tax)} />
        <Divider my={1} />
        <Row label="Total" value={money(totals.total)} bold />
      </VStack>
      {children}
    </Box>
  );
}
