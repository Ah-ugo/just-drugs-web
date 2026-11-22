'use client';
import NextLink from 'next/link';
import { useMemo } from 'react';
import { Box, Button, Flex, Grid, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { OrderStatusBadge } from '@/components/ui/Layout';
import { ErrorNote, Loading, PageHeader, Panel, StatCard, useLoad } from './ui';
import { customerOf, ORDER_GROUPS } from './orderHelpers';
import { useAdmin } from '@/context/AdminContext';
import { adminApi } from '@/lib/api';
import { money } from '@/lib/format';
import { parseDate } from '@/lib/format';
import { sameDay, timeAgo } from '@/lib/admin';

export default function Dashboard() {
  const { admin, can } = useAdmin();
  const { loading, data, error, reload } = useLoad(async () => {
    const out = { metrics: null, top: [], orders: [], rx: null };
    const jobs = [];
    if (can('analytics:read')) jobs.push(adminApi.get('/analytics/dashboard').then((r) => { out.metrics = r.data.metrics; out.top = r.data.top_selling_products || []; }).catch(() => {}));
    if (can('orders:read')) jobs.push(adminApi.get('/orders').then((r) => { out.orders = r.data || []; }).catch(() => {}));
    if (can('prescription:review')) jobs.push(adminApi.get('/prescriptions/pharmacist/queue', { status: 'pending' }).then((r) => { out.rx = (r.data || []).length; }).catch(() => {}));
    await Promise.all(jobs);
    return out;
  }, [], { poll: 60000 });

  const stats = useMemo(() => {
    const orders = data?.orders || [];
    const paid = orders.filter((o) => o.payment_status === 'paid');
    const now = new Date();
    const today = paid.filter((o) => { const d = parseDate(o.created_at); return d && sameDay(d, now); });
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() - (6 - i)); return d; });
    const series = days.map((d) => ({ d, total: paid.filter((o) => { const x = parseDate(o.created_at); return x && sameDay(x, d); }).reduce((s, o) => s + (o.total_amount || 0), 0) }));
    const groups = ORDER_GROUPS.filter((g) => g.key !== 'all').map((g) => ({ ...g, n: orders.filter(g.test).length }));
    return { todayRevenue: today.reduce((s, o) => s + (o.total_amount || 0), 0), todayCount: today.length, series, groups, recent: orders.slice(0, 6) };
  }, [data]);

  const m = data?.metrics;
  const max = Math.max(1, ...stats.series.map((x) => x.total));

  return (
    <>
      <PageHeader title={`Hello${admin?.email ? `, ${admin.email.split('@')[0]}` : ''} 👋`} subtitle="Here’s what needs your attention today." actions={<Button variant="outline" leftIcon={<Icon name="refresh" size={18} />} onClick={reload}>Refresh</Button>} />
      {loading ? <Loading /> : error ? <ErrorNote error={error} onRetry={reload} /> : (
        <VStack align="stretch" spacing={6}>
          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
            {data.rx !== null && <StatCard label="Prescriptions waiting" value={data.rx} icon="doc" tone={data.rx ? 'gold' : 'pine'} href="/admin/prescriptions" hint={data.rx ? 'Review now' : 'All caught up'} />}
            {can('orders:read') && <StatCard label="Orders to pack" value={stats.groups.find((g) => g.key === 'packing')?.n || 0} icon="box" tone="gold" href="/admin/orders" hint="Paid, not yet packed" />}
            {can('orders:read') && <StatCard label="Today’s sales" value={money(stats.todayRevenue)} icon="wallet" hint={`${stats.todayCount} paid order${stats.todayCount === 1 ? '' : 's'}`} />}
            {m && <StatCard label="Total revenue" value={money(m.total_revenue)} icon="chart" hint={`${m.total_paid_orders} paid orders`} />}
            {m && <StatCard label="Low / out of stock" value={m.low_stock_items_count} icon="stock" tone={m.low_stock_items_count ? 'coral' : 'pine'} href="/admin/inventory" />}
            {m && <StatCard label="Customers" value={m.total_customers} icon="people" />}
          </SimpleGrid>

          {can('orders:read') && (
            <Grid templateColumns={{ base: '1fr', xl: '1.4fr 1fr' }} gap={6}>
              <Panel title="Sales, last 7 days" actions={<Text fontSize="xs" color="ink.500">from your latest orders</Text>}>
                <Flex align="flex-end" gap={{ base: 2, md: 4 }} h="180px">
                  {stats.series.map((x, i) => (
                    <Flex key={i} flex={1} direction="column" align="center" justify="flex-end" h="100%" gap={1.5}>
                      <Text fontSize="xs" fontWeight={700} color="ink.600" noOfLines={1}>{x.total ? money(x.total) : ''}</Text>
                      <Box w="100%" maxW="56px" borderRadius="lg" bg={i === 6 ? 'gold.400' : 'pine.200'} h={`${Math.max(4, (x.total / max) * 120)}px`} transition="height .4s" />
                      <Text fontSize="xs" color="ink.500">{x.d.toLocaleDateString('en-NG', { weekday: 'short' })}</Text>
                    </Flex>
                  ))}
                </Flex>
              </Panel>
              <Panel title="Orders by stage">
                <VStack align="stretch" spacing={2.5}>
                  {stats.groups.map((g) => (
                    <HStack key={g.key} as={NextLink} href="/admin/orders" justify="space-between" p={2.5} borderRadius="lg" _hover={{ bg: 'ink.50' }}>
                      <Text fontWeight={600}>{g.label}</Text><Text fontFamily="heading" fontWeight={800}>{g.n}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Panel>
            </Grid>
          )}

          <Grid templateColumns={{ base: '1fr', xl: '1.4fr 1fr' }} gap={6}>
            {can('orders:read') && (
              <Panel title="Latest orders" actions={<Button as={NextLink} href="/admin/orders" size="sm" variant="ghost">View all</Button>}>
                <VStack align="stretch" spacing={0} divider={<Box borderBottom="1px solid" borderColor="ink.100" />}>
                  {stats.recent.length === 0 && <Text color="ink.500" py={4}>No orders yet.</Text>}
                  {stats.recent.map((o) => (
                    <Flex key={o._id} as={NextLink} href={`/admin/orders/${o.order_number}`} py={3} gap={3} justify="space-between" align="center" _hover={{ bg: 'ink.50' }} px={1} borderRadius="md">
                      <Box minW={0}><Text fontWeight={700} noOfLines={1}>{o.order_number}</Text><Text fontSize="sm" color="ink.500" noOfLines={1}>{customerOf(o)} · {timeAgo(o.created_at)}</Text></Box>
                      <HStack spacing={3} flexShrink={0}><OrderStatusBadge status={o.status} /><Text fontWeight={800} minW="80px" textAlign="right">{money(o.total_amount)}</Text></HStack>
                    </Flex>
                  ))}
                </VStack>
              </Panel>
            )}
            {data.top.length > 0 && (
              <Panel title="Top sellers">
                <VStack align="stretch" spacing={3}>
                  {data.top.map((p, i) => (
                    <HStack key={p._id || i} spacing={3}>
                      <Flex w="30px" h="30px" borderRadius="full" bg="gold.100" color="pine.900" align="center" justify="center" fontWeight={800} flexShrink={0}>{i + 1}</Flex>
                      <Box flex={1} minW={0}><Text fontWeight={700} noOfLines={1}>{p.product_name}</Text><Text fontSize="xs" color="ink.500">{p.total_quantity_sold} sold</Text></Box>
                      <Text fontWeight={800}>{money(p.total_revenue_generated)}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Panel>
            )}
          </Grid>
        </VStack>
      )}
    </>
  );
}
