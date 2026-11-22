'use client';
import NextLink from 'next/link';
import { Box, Button, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { ErrorNote, Guard, Loading, PageHeader, Pill, useLoad } from './ui';
import StockActions from './StockActions';
import { adminApi } from '@/lib/api';

export default function InventoryAdmin() {
  const { loading, data, error, reload } = useLoad(async () => {
    const alerts = (await adminApi.get('/inventory/alerts/low-stock')).data || [];
    // The alerts only carry product ids, so resolve names from the catalogue.
    const names = {};
    for (let page = 1; page <= 5; page += 1) {
      const r = await adminApi.get('/products', { page, limit: 100 }).catch(() => null);
      (r?.data || []).forEach((p) => { names[p._id] = p; });
      if (!r || page >= (r.meta?.pages || 1)) break;
    }
    return alerts.map((a) => ({ ...a, product: names[a.product_id] })).sort((x, y) => (x.available_stock ?? 0) - (y.available_stock ?? 0));
  }, [], { poll: 120000 });

  return (
    <Guard perm="inventory:read">
      <PageHeader title="Inventory alerts" subtitle="Products at or below their minimum stock, lowest first." actions={<Button variant="outline" leftIcon={<Icon name="refresh" size={18} />} onClick={reload}>Refresh</Button>} />
      {loading ? <Loading /> : error ? <ErrorNote error={error} onRetry={reload} /> : (
        <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" overflow="hidden">
          <TableContainer><Table>
            <Thead bg="ink.50"><Tr><Th>Product</Th><Th isNumeric>Available</Th><Th isNumeric>Minimum</Th><Th>Status</Th><Th w="1%" /></Tr></Thead>
            <Tbody>
              {data.length === 0 && <Tr><Td colSpan={5} textAlign="center" py={12} color="ink.500">Nothing is running low 🎉</Td></Tr>}
              {data.map((a) => (
                <Tr key={a._id} _hover={{ bg: 'ink.50' }}>
                  <Td whiteSpace="normal"><Text as={NextLink} href={`/admin/products/${a.product_id}`} fontWeight={700}>{a.product?.name || 'Unknown product'}</Text><Text fontSize="xs" color="ink.500">{a.product?.sku}{a.supplier ? ` · ${a.supplier}` : ''}</Text></Td>
                  <Td isNumeric fontWeight={800} color={(a.available_stock ?? 0) <= 0 ? 'coral.600' : undefined}>{a.available_stock ?? 0}</Td>
                  <Td isNumeric>{a.minimum_stock}</Td>
                  <Td><Pill color={(a.available_stock ?? 0) <= 0 ? 'red' : 'orange'}>{(a.available_stock ?? 0) <= 0 ? 'Out of stock' : 'Low stock'}</Pill></Td>
                  <Td><StockActions productId={a.product_id} productName={a.product?.name} onDone={reload} /></Td>
                </Tr>
              ))}
            </Tbody>
          </Table></TableContainer>
        </Box>
      )}
    </Guard>
  );
}
