'use client';
import NextLink from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Button, Center, Heading, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { EmptyState, Page } from '@/components/ui/Layout';
import { api, apiUrl } from '@/lib/api';
import { storage } from '@/lib/storage';
import { money } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { invoiceShareMessage } from '@/lib/whatsapp';
import { siteOrigin } from '@/lib/config';

function Check() {
  return (
    <Center w="96px" h="96px" borderRadius="full" bg="pine.500" color="white" animation="jd-pop .5s ease both">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" strokeDashoffset="24" style={{ animation: 'jd-draw .45s .25s ease forwards' }} />
      </svg>
    </Center>
  );
}

export default function VerifyView() {
  const sp = useSearchParams();
  const reference = sp.get('reference') || sp.get('trxref') || storage.getJSON('jd_last_order')?.reference;
  const { clearLocal } = useCart();
  const { wa } = useStore();
  const [state, setState] = useState({ phase: 'loading', data: null, error: '' });
  const started = useRef(false);

  const verify = useCallback(async () => {
    if (!reference) { setState({ phase: 'error', data: null, error: 'We couldn’t find a payment reference.' }); return; }
    setState((s) => ({ ...s, phase: 'loading' }));
    try {
      const r = await api.get(`/payments/verify/${encodeURIComponent(reference)}`);
      const d = r.data;
      if (d.status === 'success') { clearLocal(); storage.remove('jd_coupon'); setState({ phase: 'success', data: d, error: '' }); }
      else setState({ phase: 'failed', data: d, error: d.message || '' });
    } catch (e) { setState({ phase: 'error', data: null, error: e.message }); }
  }, [reference, clearLocal]);

  useEffect(() => { if (started.current) return; started.current = true; verify(); }, [verify]);

  if (state.phase === 'loading') {
    return <Page py={20}><Center flexDirection="column" gap={4}><Spinner size="xl" color="pine.500" thickness="4px" /><Heading as="h1" fontSize="2xl">Confirming your payment…</Heading><Text color="ink.600">Please don’t close this page.</Text></Center></Page>;
  }
  if (state.phase !== 'success') {
    return (
      <Page py={10}>
        <EmptyState icon="danger" title={state.phase === 'failed' ? 'Payment didn’t go through' : 'We couldn’t confirm your payment'}
          text={state.error || 'No money was taken if the payment failed. If you were debited, wait a minute and check again — or message us with your reference.'}>
          <HStack flexWrap="wrap" justify="center">
            <Button variant="buy" onClick={verify}>Check again</Button>
            <Button as={NextLink} href="/cart" variant="outline">Back to cart</Button>
            <Button as="a" href={wa(`Hello 👋 I need help with a payment. Reference: ${reference || 'n/a'}`)} target="_blank" rel="noopener noreferrer" variant="wa" leftIcon={<WhatsAppIcon size={18} />}>Get help</Button>
          </HStack>
        </EmptyState>
      </Page>
    );
  }

  const o = state.data.order || {};
  const hasOrder = !!o.order_number;
  const invoicePath = `/orders/${o.order_number}/invoice`;
  return (
    <Page py={{ base: 8, md: 14 }}>
      <VStack spacing={5} maxW="640px" mx="auto" textAlign="center">
        <Check />
        <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }}>Payment received. Thank you!</Heading>
        <Text color="ink.600" fontSize="lg">{hasOrder ? <>We’re preparing order <b>{o.order_number}</b>. A receipt has been sent to your email.</> : 'We’ve received your payment and are preparing your order.'}</Text>

        <Box w="100%" bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={5} textAlign="left">
          <VStack align="stretch" spacing={2}>
            {(o.items || []).map((it, i) => (
              <HStack key={i} justify="space-between" align="start"><Text>{it.product_name} <Text as="span" color="ink.500">× {it.quantity}</Text></Text><Text fontWeight={700}>{money(it.total_price)}</Text></HStack>
            ))}
            <HStack justify="space-between" pt={3} borderTop="1px solid" borderColor="ink.100"><Text fontFamily="heading" fontWeight={800} fontSize="lg">Total paid</Text><Text fontFamily="heading" fontWeight={800} fontSize="lg">{money(o.total_amount ?? state.data.payment?.amount)}</Text></HStack>
          </VStack>
        </Box>

        <VStack w="100%" spacing={3}>
          {hasOrder && <>
          <Button as={NextLink} href={invoicePath} variant="buy" size="lg" w="full" leftIcon={<Icon name="receipt" size={20} />}>View invoice</Button>
          <HStack w="100%" spacing={3}>
            <Button as="a" href={apiUrl(`/orders/${o.order_number}/invoice.pdf`)} download variant="outline" flex={1} leftIcon={<Icon name="download" size={18} />}>PDF</Button>
            <Button as={NextLink} href={`/track?order=${o.order_number}`} variant="outline" flex={1} leftIcon={<Icon name="truck" size={18} />}>Track order</Button>
          </HStack>
          <Button as="a" href={wa(invoiceShareMessage({ orderNumber: o.order_number, total: o.total_amount, url: `${siteOrigin()}${invoicePath}` }))} target="_blank" rel="noopener noreferrer" variant="wa" w="full" leftIcon={<WhatsAppIcon size={20} />}>Share invoice on WhatsApp</Button>
          </>}
          <Button as={NextLink} href="/shop" variant="ghost">Continue shopping</Button>
        </VStack>
      </VStack>
    </Page>
  );
}
