'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Box, Button, Center, Grid, Heading, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { EmptyState, OrderStatusBadge, Page } from '@/components/ui/Layout';
import DeliveryTimeline from './DeliveryTimeline';
import { api } from '@/lib/api';
import { fmtDateTime, money } from '@/lib/format';
import { useStore } from '@/context/StoreContext';

export default function OrderView({ orderNumber }) {
  const { wa } = useStore();
  const [s, setS] = useState({ loading: true, order: null, track: null, error: '' });
  useEffect(() => {
    const n = encodeURIComponent(orderNumber);
    Promise.all([api.get(`/orders/${n}`, null, { auth: false, guest: false }), api.get(`/delivery/track/${n}`, null, { auth: false, guest: false }).catch(() => null)])
      .then(([o, t]) => setS({ loading: false, order: o.data, track: t?.data || null, error: '' }))
      .catch((e) => setS({ loading: false, order: null, track: null, error: e.message }));
  }, [orderNumber]);

  if (s.loading) return <Page py={20}><Center><Spinner size="xl" color="pine.500" thickness="4px" /></Center></Page>;
  if (!s.order) return <Page py={8}><EmptyState icon="box" title="Order not found" text={s.error}><Button as={NextLink} href="/track" variant="buy">Track an order</Button></EmptyState></Page>;

  const o = s.order; const d = s.track?.delivery_details; const a = o.delivery_address || {};
  return (
    <Page py={{ base: 5, md: 10 }} maxW="1000px">
      <HStack justify="space-between" flexWrap="wrap" gap={3} mb={6}>
        <Box><Text color="ink.500" fontWeight={600}>Order</Text><Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }}>{o.order_number}</Heading><Text color="ink.500">Placed {fmtDateTime(o.created_at)}</Text></Box>
        <OrderStatusBadge status={o.status} />
      </HStack>

      {o.payment_status !== 'paid' && o.status === 'pending_payment' && (
        <Alert status="warning" borderRadius="xl" mb={5} bg="gold.50"><AlertIcon color="gold.600" />This order is waiting for payment. If you’ve paid already, it can take a minute to confirm.</Alert>
      )}

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5} alignItems="start">
        <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={6}>
          <Heading as="h2" fontSize="xl" mb={5}>Delivery progress</Heading>
          {o.status === 'cancelled' ? <Text color="coral.600" fontWeight={700}>This order was cancelled.</Text> : <DeliveryTimeline status={o.status} history={d?.status_history} />}
          {d?.rider_name && (
            <HStack mt={6} p={4} bg="pine.50" borderRadius="xl" justify="space-between"><Box><Text fontSize="xs" color="ink.500" fontWeight={700}>YOUR RIDER</Text><Text fontWeight={800}>{d.rider_name}</Text></Box>
              {d.rider_phone && <Button as="a" href={`tel:${d.rider_phone}`} size="sm" variant="dark" leftIcon={<Icon name="call" size={16} />}>Call</Button>}</HStack>
          )}
        </Box>

        <VStack align="stretch" spacing={5}>
          <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={6}>
            <Heading as="h2" fontSize="xl" mb={4}>Items</Heading>
            <VStack align="stretch" spacing={2.5}>
              {o.items.map((it, i) => <HStack key={i} justify="space-between" align="start"><Text>{it.product_name} <Text as="span" color="ink.500">× {it.quantity}</Text></Text><Text fontWeight={700}>{money(it.total_price)}</Text></HStack>)}
              <HStack justify="space-between" pt={3} borderTop="1px solid" borderColor="ink.100"><Text fontFamily="heading" fontWeight={800}>Total</Text><Text fontFamily="heading" fontWeight={800}>{money(o.total_amount)}</Text></HStack>
            </VStack>
          </Box>
          <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={6}>
            <Heading as="h2" fontSize="xl" mb={2}>Delivering to</Heading>
            <Text fontWeight={700}>{a.recipient_name}</Text><Text color="ink.600">{a.street_address}, {a.city}, {a.state}</Text><Text color="ink.600">{a.phone}</Text>
          </Box>
          <HStack spacing={3} flexWrap="wrap">
            <Button as={NextLink} href={`/orders/${o.order_number}/invoice`} variant="buy" leftIcon={<Icon name="receipt" size={18} />}>View invoice</Button>
            <Button as="a" href={wa(`Hello 👋 I need help with order ${o.order_number}.`)} target="_blank" rel="noopener noreferrer" variant="wa" leftIcon={<WhatsAppIcon size={18} />}>Ask about this order</Button>
          </HStack>
        </VStack>
      </Grid>
    </Page>
  );
}
