'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertIcon, Box, Button, FormControl, FormLabel, Heading, HStack, Input, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { OrderStatusBadge, Page } from '@/components/ui/Layout';
import DeliveryTimeline from './DeliveryTimeline';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { normalizePhone } from '@/lib/format';

export default function TrackView() {
  const sp = useSearchParams();
  const [order, setOrder] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState(null);

  useEffect(() => {
    const last = storage.getJSON('jd_last_order') || {};
    setOrder(sp.get('order') || last.order_number || '');
    setPhone(last.phone || '');
  }, [sp]);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setRes(null);
    if (!order.trim()) return setErr('Enter your order number, e.g. JD-20261121-A1B2C3.');
    setBusy(true);
    try {
      const r = await api.get(`/delivery/track/${encodeURIComponent(order.trim().toUpperCase())}`, { phone: phone.trim() ? normalizePhone(phone) : undefined }, { auth: false, guest: false });
      setRes(r.data);
    } catch (e2) { setErr(e2.status === 404 ? 'We couldn’t find that order. Check the number and try again.' : e2.message); } finally { setBusy(false); }
  };

  const d = res?.delivery_details;
  return (
    <Page py={{ base: 6, md: 12 }} maxW="760px">
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }}>Track your order</Heading>
      <Text color="ink.600" mt={2} mb={6}>Enter your order number and the phone number you used at checkout.</Text>
      <VStack as="form" onSubmit={submit} align="stretch" spacing={4} bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={{ base: 4, md: 6 }}>
        <FormControl><FormLabel>Order number</FormLabel><Input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="JD-20261121-A1B2C3" autoCapitalize="characters" /></FormControl>
        <FormControl><FormLabel>Phone number</FormLabel><Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" /></FormControl>
        {err && <Alert status="error" borderRadius="xl" role="alert"><AlertIcon />{err}</Alert>}
        <Button type="submit" variant="buy" size="lg" isLoading={busy} leftIcon={<Icon name="search" size={19} />}>Track order</Button>
      </VStack>

      {res && (
        <Box mt={6} bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={{ base: 4, md: 6 }}>
          <HStack justify="space-between" flexWrap="wrap" mb={5}>
            <Box><Text fontWeight={800} fontSize="lg">{res.order_number}</Text><Text color="ink.500" fontSize="sm">Estimated delivery: {res.estimated_delivery}</Text></Box>
            <OrderStatusBadge status={res.order_status} />
          </HStack>
          {res.order_status === 'pending_payment' ? <Alert status="warning" borderRadius="xl" bg="gold.50"><AlertIcon color="gold.600" />Waiting for payment confirmation.</Alert>
            : res.order_status === 'cancelled' ? <Text color="coral.600" fontWeight={700}>This order was cancelled.</Text>
            : <DeliveryTimeline status={res.order_status} history={d?.status_history} />}
          {d?.rider_name && (
            <HStack mt={6} p={4} bg="pine.50" borderRadius="xl" justify="space-between"><Box><Text fontSize="xs" color="ink.500" fontWeight={700}>YOUR RIDER</Text><Text fontWeight={800}>{d.rider_name}</Text></Box>
              {d.rider_phone && <Button as="a" href={`tel:${d.rider_phone}`} size="sm" variant="dark" leftIcon={<Icon name="call" size={16} />}>Call rider</Button>}</HStack>
          )}
          <HStack mt={5} spacing={3}>
            <Button as={NextLink} href={`/orders/${res.order_number}`} variant="outline" size="sm">Order details</Button>
            <Button as={NextLink} href={`/orders/${res.order_number}/invoice`} variant="outline" size="sm" leftIcon={<Icon name="receipt" size={16} />}>Invoice</Button>
          </HStack>
        </Box>
      )}
    </Page>
  );
}
