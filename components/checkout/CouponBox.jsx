'use client';
import { useState } from 'react';
import { Button, HStack, Input, Tag, TagCloseButton, TagLabel, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { useCoupon } from '@/lib/coupon';
import { couponDiscount } from '@/lib/pricing';
import { money } from '@/lib/format';

export default function CouponBox({ subtotal, coupon, onApply, onRemove }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (coupon) {
    return (
      <HStack justify="space-between" bg="pine.50" borderRadius="xl" p={3}>
        <HStack spacing={2} color="pine.700"><Icon name="tag" size={18} /><Text fontWeight={700}>{coupon.code} saves {money(couponDiscount(coupon, subtotal))}</Text></HStack>
        <Button size="xs" variant="ghost" onClick={onRemove}>Remove</Button>
      </HStack>
    );
  }
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await onApply(code); setCode(''); } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <VStack as="form" onSubmit={submit} align="stretch" spacing={1.5}>
      <HStack>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" textTransform="uppercase" autoCapitalize="characters" />
        <Button type="submit" variant="dark" isLoading={busy} flexShrink={0}>Apply</Button>
      </HStack>
      {err && <Text fontSize="sm" color="coral.600" role="alert">{err}</Text>}
    </VStack>
  );
}
