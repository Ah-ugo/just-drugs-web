'use client';
import NextLink from 'next/link';
import { useMemo, useState } from 'react';
import { Box, Button, Flex, HStack, Input, Select, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, Wrap, WrapItem } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { OrderStatusBadge } from '@/components/ui/Layout';
import { ErrorNote, Guard, Loading, PageHeader, Pill, useLoad } from './ui';
import { customerOf, ORDER_GROUPS, phoneOf } from './orderHelpers';
import { adminApi } from '@/lib/api';
import { fmtDateTime, money } from '@/lib/format';
import { useNotify } from '@/lib/hooks';

export default function OrdersList() {
  const notify = useNotify();
  const { loading, data, error, reload, setData } = useLoad(async () => (await adminApi.get('/orders')).data || [], [], { poll: 60000 });
  const [group, setGroup] = useState('all');
  const [q, setQ] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const orders = useMemo(() => data || [], [data]);
  const counts = useMemo(() => Object.fromEntries(ORDER_GROUPS.map((g) => [g.key, orders.filter(g.test).length])), [orders]);
  const g = ORDER_GROUPS.find((x) => x.key === group) || ORDER_GROUPS[ORDER_GROUPS.length - 1];
  const rows = orders.filter((o) => g.test(o) && (!q.trim() || `${o.order_number} ${customerOf(o)} ${phoneOf(o)}`.toLowerCase().includes(q.trim().toLowerCase())));

  const handleQuickStatusChange = async (orderNumber, newStatus) => {
    setUpdatingId(orderNumber);
    // Optimistic update
    setData((prev) => (prev || []).map((ord) => ord.order_number === orderNumber ? { ...ord, status: newStatus } : ord));
    try {
      await adminApi.put(`/orders/${encodeURIComponent(orderNumber)}/status`, { status: newStatus });
      notify.success('Status updated', `${orderNumber} is now ${newStatus.replace(/_/g, ' ')}`);
      await reload();
    } catch (err) {
      notify.error('Update failed', err.message);
      await reload();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Guard perm="orders:read">
      <PageHeader title="Orders" subtitle="Pack, dispatch and track every order." actions={<Button variant="outline" leftIcon={<Icon name="refresh" size={18} />} onClick={reload}>Refresh</Button>} />
      <Wrap spacing={2} mb={4}>
        {ORDER_GROUPS.map((x) => (
          <WrapItem key={x.key}><Button size="sm" variant={group === x.key ? 'dark' : 'outline'} onClick={() => setGroup(x.key)}>
            {x.label}<Box as="span" ml={1.5} px={1.5} borderRadius="full" bg={group === x.key ? 'whiteAlpha.300' : x.key === 'packing' && counts.packing ? 'gold.300' : 'ink.100'} fontSize="xs">{counts[x.key] || 0}</Box></Button></WrapItem>
        ))}
      </Wrap>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order number, name or phone" bg="white" maxW="420px" mb={4} aria-label="Search orders" />
      {loading ? <Loading /> : error ? <ErrorNote error={error} onRetry={reload} /> : (
        <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" overflow="hidden">
          <TableContainer>
            <Table>
              <Thead bg="ink.50">
                <Tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Placed</Th>
                  <Th isNumeric>Items</Th>
                  <Th isNumeric>Total</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th>Quick update</Th>
                  <Th pr={4}>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.length === 0 && <Tr><Td colSpan={9} textAlign="center" py={12} color="ink.500">No orders in this view.</Td></Tr>}
                {rows.map((o) => (
                  <Tr key={o._id} _hover={{ bg: 'ink.50' }}>
                    <Td><Text as={NextLink} href={`/admin/orders/${o.order_number}`} fontWeight={800} color="pine.700">{o.order_number}</Text></Td>
                    <Td whiteSpace="normal"><Text fontWeight={600}>{customerOf(o)}</Text><Text fontSize="xs" color="ink.500">{phoneOf(o)}</Text></Td>
                    <Td fontSize="sm" color="ink.600">{fmtDateTime(o.created_at)}</Td>
                    <Td isNumeric>{(o.items || []).reduce((s, i) => s + i.quantity, 0)}</Td>
                    <Td isNumeric fontWeight={800}>{money(o.total_amount)}</Td>
                    <Td><Pill color={o.payment_status === 'paid' ? 'green' : 'orange'}>{o.payment_status}</Pill></Td>
                    <Td><OrderStatusBadge status={o.status} /></Td>
                    <Td onClick={(e) => e.stopPropagation()}>
                      <Select
                        size="xs"
                        w="150px"
                        borderRadius="md"
                        bg="white"
                        value={o.status}
                        isDisabled={updatingId === o.order_number}
                        onChange={(e) => handleQuickStatusChange(o.order_number, e.target.value)}
                      >
                        <option value="pending_payment">Pending payment</option>
                        <option value="preparing">Preparing</option>
                        <option value="packed">Packed</option>
                        <option value="assigned">Assigned to rider</option>
                        <option value="picked_up">Picked up</option>
                        <option value="out_for_delivery">Out for delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </Select>
                    </Td>
                    <Td pr={4}>
                      <Button as={NextLink} href={`/admin/orders/${o.order_number}`} size="xs" variant="outline">
                        Manage →
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
      <Text mt={3} fontSize="xs" color="ink.500">Showing the 200 most recent orders. Updates automatically every minute.</Text>
    </Guard>
  );
}
