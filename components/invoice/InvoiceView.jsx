'use client';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Center, Spinner } from '@chakra-ui/react';
import Invoice from './Invoice';
import { EmptyState, Page } from '@/components/ui/Layout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function InvoiceView({ orderNumber }) {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  useEffect(() => {
    api.get(`/orders/${encodeURIComponent(orderNumber)}/invoice`, null, { auth: false, guest: false })
      .then((r) => setState({ loading: false, data: r.data, error: '' }))
      .catch((e) => setState({ loading: false, data: null, error: e.message }));
  }, [orderNumber]);

  if (state.loading) return <Page py={20}><Center><Spinner size="xl" color="pine.500" thickness="4px" /></Center></Page>;
  if (!state.data) return <Page py={8}><EmptyState icon="receipt" title="Invoice not found" text={state.error || 'Check the order number and try again.'}><Button as={NextLink} href="/track" variant="buy">Track an order</Button></EmptyState></Page>;

  const { order, settings } = state.data;
  const billTo = order.guest_info || { name: order.delivery_address?.recipient_name || (user ? `${user.first_name} ${user.last_name}` : ''), email: user?.email, phone: order.delivery_address?.phone };
  return <Invoice order={order} company={settings} billTo={billTo} />;
}
