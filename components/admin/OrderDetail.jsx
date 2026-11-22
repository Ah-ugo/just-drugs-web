'use client';
import NextLink from 'next/link';
import { useState } from 'react';
import { Alert, AlertIcon, Box, Button, Flex, Grid, HStack, Input, Select, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import DeliveryTimeline from '@/components/invoice/DeliveryTimeline';
import { OrderStatusBadge } from '@/components/ui/Layout';
import { AdminModal, ConfirmDialog, ErrorNote, Field, Guard, Loading, PageHeader, Panel, Pill, useLoad } from './ui';
import { customerOf, phoneOf } from './orderHelpers';
import { useAdmin } from '@/context/AdminContext';
import { adminApi } from '@/lib/api';
import { fmtDateTime, money, normalizePhone } from '@/lib/format';
import { useNotify } from '@/lib/hooks';
import { waLink } from '@/lib/whatsapp';

const NEXT_STEP = {
  pending_payment: { to: 'preparing', label: 'Confirm payment & prepare', icon: 'check', markPaid: true },
  pending: { to: 'preparing', label: 'Start preparing', icon: 'box' },
  preparing: { to: 'packed', label: 'Mark as packed', icon: 'box' },
  packed: { to: 'assign', label: 'Assign rider', icon: 'truck' },
  assigned: { to: 'picked_up', label: 'Rider picked up', icon: 'check' },
  picked_up: { to: 'out_for_delivery', label: 'Out for delivery', icon: 'truck' },
  out_for_delivery: { to: 'delivered', label: 'Mark delivered', icon: 'check' },
};

export default function OrderDetail({ orderNumber }) {
  const { can } = useAdmin();
  const notify = useNotify();
  const n = encodeURIComponent(orderNumber);
  const { loading, data, error, reload, setData } = useLoad(async () => {
    const order = (await adminApi.get(`/orders/${n}`)).data;
    // Tracking also creates the delivery record the fulfilment endpoints need.
    const track = (await adminApi.get(`/delivery/track/${n}`).catch(() => null))?.data || null;
    return { order, track };
  }, [orderNumber]);
  const [busy, setBusy] = useState(false);
  const [rider, setRider] = useState(null);
  const [cancel, setCancel] = useState(false);
  const [note, setNote] = useState('');
  const [rErr, setRErr] = useState('');
  const [manualStatus, setManualStatus] = useState('');

  const o = data?.order;
  const canDeliver = can('delivery:update');
  const canStatus = canDeliver || can('orders:update_status');

  const setStatus = async (status, noteText, options = {}) => {
    setBusy(true);
    // Instant optimistic update on UI
    setData((prev) => (prev && prev.order ? {
      ...prev,
      order: {
        ...prev.order,
        status,
        ...(options.paymentStatus ? { payment_status: options.paymentStatus } : {}),
      },
    } : prev));

    try {
      const payload = { status, note: noteText || null };
      if (options.paymentStatus) payload.payment_status = options.paymentStatus;
      await adminApi.put(`/orders/${n}/status`, payload);
      if (canDeliver && o?._id) {
        await adminApi.patch(`/delivery/orders/${o._id}/status`, { status, note: noteText || null }).catch(() => {});
      }
      notify.success(`Order marked as ${status.replace(/_/g, ' ')}`);
      setCancel(false);
      setNote('');
      setManualStatus('');
      await reload();
    } catch (e) {
      notify.error('Couldn’t update the order', e.message);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const assign = async () => {
    const name = rider.name.trim(); const phone = normalizePhone(rider.phone);
    if (name.length < 2 || phone.replace(/\D/g, '').length < 10) return setRErr('Enter the rider’s name and a valid phone number.');
    setBusy(true); setRErr('');
    try {
      await adminApi.patch(`/delivery/orders/${o._id}/assign`, { rider_id: `rider-${phone.replace(/\D/g, '')}`, rider_name: name, rider_phone: phone });
      notify.success('Rider assigned'); setRider(null); await reload();
    } catch (e) { setRErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Guard perm="orders:read">
      <Button as={NextLink} href="/admin/orders" variant="ghost" size="sm" mb={3} leftIcon={<Icon name="left" size={16} />}>All orders</Button>
      {loading ? <Loading /> : error || !o ? <ErrorNote error={error || 'Order not found'} onRetry={reload} /> : (() => {
        const step = NEXT_STEP[o.status];
        const d = data.track?.delivery_details;
        const phone = phoneOf(o);
        const a = o.delivery_address || {};
        const done = o.status === 'delivered' || o.status === 'cancelled';
        return (
          <>
            <PageHeader title={o.order_number} subtitle={`Placed ${fmtDateTime(o.created_at)}`}
              actions={<><OrderStatusBadge status={o.status} /><Pill color={o.payment_status === 'paid' ? 'green' : 'orange'} solid>{o.payment_status}</Pill></>} />

            {o.payment_status !== 'paid' && o.status === 'pending_payment' && <Alert status="warning" borderRadius="xl" mb={5} bg="gold.50"><AlertIcon color="gold.600" />Not paid yet — don’t pack this order until payment is confirmed.</Alert>}

            <Grid templateColumns={{ base: '1fr', xl: '1.5fr 1fr' }} gap={6} alignItems="start">
              <VStack align="stretch" spacing={6}>
                <Panel title="Items">
                  <TableContainer><Table size="sm"><Thead><Tr><Th pl={0}>Item</Th><Th isNumeric>Qty</Th><Th isNumeric>Unit</Th><Th isNumeric pr={0}>Total</Th></Tr></Thead>
                    <Tbody>{(o.items || []).map((it, i) => (
                      <Tr key={i}><Td pl={0} whiteSpace="normal"><Text fontWeight={700}>{it.product_name}</Text>{it.sku && <Text fontSize="xs" color="ink.500">{it.sku}</Text>}</Td>
                        <Td isNumeric>{it.quantity}</Td><Td isNumeric>{money(it.unit_price)}</Td><Td isNumeric pr={0} fontWeight={700}>{money(it.total_price)}</Td></Tr>
                    ))}</Tbody></Table></TableContainer>
                  <VStack align="stretch" spacing={1.5} mt={4} ml="auto" maxW="300px" fontSize="sm">
                    <HStack justify="space-between"><Text color="ink.600">Subtotal</Text><Text>{money(o.subtotal)}</Text></HStack>
                    {o.discount_amount > 0 && <HStack justify="space-between"><Text color="ink.600">Discount</Text><Text>−{money(o.discount_amount)}</Text></HStack>}
                    <HStack justify="space-between"><Text color="ink.600">Delivery</Text><Text>{money(o.delivery_fee)}</Text></HStack>
                    <HStack justify="space-between"><Text color="ink.600">Tax</Text><Text>{money(o.tax_amount)}</Text></HStack>
                    <HStack justify="space-between" pt={2} borderTop="1px solid" borderColor="ink.100" fontFamily="heading" fontWeight={800} fontSize="lg"><Text>Total</Text><Text>{money(o.total_amount)}</Text></HStack>
                  </VStack>
                </Panel>
                <Panel title="Delivery progress">
                  {o.status === 'cancelled' ? <Text color="coral.600" fontWeight={700}>This order was cancelled.</Text> : o.status === 'pending_payment' ? <Text color="ink.500">Waiting for payment.</Text> : <DeliveryTimeline status={o.status} history={d?.status_history} />}
                </Panel>
              </VStack>

              <VStack align="stretch" spacing={6}>
                {canStatus && !done && (
                  <Panel title="Order actions">
                    {step ? (
                      <Button
                        w="full"
                        variant="buy"
                        size="lg"
                        mb={3}
                        isLoading={busy}
                        leftIcon={<Icon name={step.icon} size={20} />}
                        onClick={() => {
                          if (step.to === 'assign') {
                            if (canDeliver) setRider({ name: '', phone: '' });
                            else notify.error('Assigning riders needs delivery access');
                          } else {
                            setStatus(step.to, null, step.markPaid ? { paymentStatus: 'paid' } : {});
                          }
                        }}
                      >
                        {step.label}
                      </Button>
                    ) : null}

                    <Box pt={step ? 3 : 0} borderTop={step ? '1px solid' : 'none'} borderColor="ink.100">
                      <Text fontSize="xs" fontWeight={700} color="ink.600" mb={1.5}>
                        Change status directly
                      </Text>
                      <HStack spacing={2}>
                        <Select
                          size="sm"
                          value={manualStatus || o.status}
                          onChange={(e) => setManualStatus(e.target.value)}
                        >
                          <option value="pending_payment">Pending payment</option>
                          <option value="preparing">Preparing</option>
                          <option value="packed">Packed</option>
                          <option value="assigned">Assigned to rider</option>
                          <option value="picked_up">Picked up by rider</option>
                          <option value="out_for_delivery">Out for delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={busy}
                          isDisabled={!manualStatus || manualStatus === o.status}
                          onClick={() => setStatus(manualStatus)}
                        >
                          Update
                        </Button>
                      </HStack>
                    </Box>

                    {d?.rider_name && <Text mt={3} fontSize="sm" color="ink.600">Rider: <b>{d.rider_name}</b> · {d.rider_phone}</Text>}
                  </Panel>
                )}
                {d?.rider_name && done && <Panel title="Rider"><Text><b>{d.rider_name}</b> · {d.rider_phone}</Text></Panel>}

                {canStatus && done && (
                  <Panel title="Order status">
                    <Text fontSize="sm" color="ink.600" mb={2}>
                      This order is {o.status}. You can change it if needed:
                    </Text>
                    <HStack spacing={2}>
                      <Select
                        size="sm"
                        value={manualStatus || o.status}
                        onChange={(e) => setManualStatus(e.target.value)}
                      >
                        <option value="pending_payment">Pending payment</option>
                        <option value="preparing">Preparing</option>
                        <option value="packed">Packed</option>
                        <option value="assigned">Assigned to rider</option>
                        <option value="picked_up">Picked up by rider</option>
                        <option value="out_for_delivery">Out for delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={busy}
                        isDisabled={!manualStatus || manualStatus === o.status}
                        onClick={() => setStatus(manualStatus)}
                      >
                        Update
                      </Button>
                    </HStack>
                  </Panel>
                )}

                <Panel title="Customer">
                  <Text fontWeight={800}>{customerOf(o)}</Text>
                  {o.guest_info?.email && <Text fontSize="sm" color="ink.600">{o.guest_info.email}</Text>}
                  {phone && <Text fontSize="sm" color="ink.600">{phone}</Text>}
                  <Text mt={3} fontSize="xs" color="ink.500" fontWeight={700}>DELIVER TO</Text>
                  <Text fontSize="sm">{a.recipient_name}<br />{a.street_address}, {a.city}, {a.state}<br />{a.phone}</Text>
                  {a.additional_notes && <Text mt={2} fontSize="sm" p={2.5} bg="gold.50" borderRadius="lg">Rider note: {a.additional_notes}</Text>}
                  <Flex gap={2} mt={4} flexWrap="wrap">
                    {phone && <Button as="a" href={`tel:${phone}`} size="sm" variant="outline" leftIcon={<Icon name="call" size={16} />}>Call</Button>}
                    {phone && <Button as="a" target="_blank" rel="noopener noreferrer" size="sm" variant="wa" leftIcon={<WhatsAppIcon size={16} />}
                      href={waLink(`Hello ${customerOf(o)} 👋 about your order ${o.order_number}:`, normalizePhone(phone).replace(/\D/g, ''))}>WhatsApp</Button>}
                  </Flex>
                </Panel>

                <Panel title="Payment & documents">
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="ink.600">Reference: {o.payment_reference || '—'}</Text>
                    <Pill color={o.payment_status === 'paid' ? 'green' : 'orange'} solid>{o.payment_status}</Pill>
                  </HStack>
                  {canStatus && o.payment_status !== 'paid' && (
                    <Button
                      size="sm"
                      variant="soft"
                      colorScheme="green"
                      w="full"
                      mt={3}
                      isLoading={busy}
                      leftIcon={<Icon name="check" size={16} />}
                      onClick={() => setStatus(o.status, 'Payment confirmed by staff', { paymentStatus: 'paid' })}
                    >
                      Mark payment as Paid
                    </Button>
                  )}
                  <Flex gap={2} mt={3} flexWrap="wrap">
                    <Button as="a" href={`/orders/${o.order_number}/invoice`} target="_blank" size="sm" variant="outline" leftIcon={<Icon name="receipt" size={16} />}>Invoice</Button>
                    {o.prescription_id && can('prescription:review') && <Button as={NextLink} href="/admin/prescriptions" size="sm" variant="outline" leftIcon={<Icon name="doc" size={16} />}>Prescription</Button>}
                  </Flex>
                </Panel>

                {canStatus && !done && <Button variant="ghost" color="coral.600" onClick={() => setCancel(true)} leftIcon={<Icon name="close" size={18} />}>Cancel this order</Button>}
              </VStack>
            </Grid>

            <AdminModal isOpen={!!rider} onClose={() => setRider(null)} title="Assign a rider" onSubmit={assign} submitLabel="Assign" busy={busy} error={rErr} size="md">
              <VStack spacing={4} align="stretch">
                <Field label="Rider’s name"><Input value={rider?.name || ''} onChange={(e) => setRider({ ...rider, name: e.target.value })} autoComplete="off" /></Field>
                <Field label="Rider’s phone" help="The customer sees this number when the order is on its way."><Input type="tel" inputMode="tel" value={rider?.phone || ''} onChange={(e) => setRider({ ...rider, phone: e.target.value })} placeholder="0803 123 4567" /></Field>
              </VStack>
            </AdminModal>

            <ConfirmDialog isOpen={cancel} onClose={() => setCancel(false)} danger busy={busy} title="Cancel this order?" confirmLabel="Cancel order" onConfirm={() => setStatus('cancelled', note || 'Cancelled by staff')}
              body={<VStack align="stretch" spacing={3}><Text>The customer will see it as cancelled. This can’t be undone from here.</Text><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" rows={2} /></VStack>} />
          </>
        );
      })()}
    </Guard>
  );
}
