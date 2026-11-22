'use client';
import NextLink from 'next/link';
import { useState } from 'react';
import { Box, Button, Flex, HStack, IconButton, Input, Select, Switch, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import ProductImage from '@/components/ui/ProductImage';
import { ConfirmDialog, ErrorNote, Guard, Loading, PageHeader, Pill, useLoad } from './ui';
import { useAdmin } from '@/context/AdminContext';
import { adminApi } from '@/lib/api';
import { money } from '@/lib/format';
import { priceInfo } from '@/lib/product';
import { useDebounced, useNotify } from '@/lib/hooks';

export default function ProductsAdmin() {
  const { can } = useAdmin();
  const notify = useNotify();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [cat, setCat] = useState('');
  const dq = useDebounced(q.trim(), 300);
  const cats = useLoad(async () => (await adminApi.get('/categories', { active_only: false })).data || [], []);
  const { loading, data, error, reload, setData } = useLoad(async () => {
    const r = await adminApi.get('/products', { q: dq || undefined, category_id: cat || undefined, page, limit: 20, sort_by: 'newest' });
    return { items: r.data || [], meta: r.meta };
  }, [dq, cat, page]);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const toggle = async (p) => {
    const next = !p.active;
    setData((d) => ({ ...d, items: d.items.map((x) => (x._id === p._id ? { ...x, active: next } : x)) }));
    try { await adminApi.put(`/products/${p._id}`, { active: next }); notify.success(next ? 'Product is live' : 'Product hidden from the store'); }
    catch (e) { notify.error('Couldn’t update', e.message); reload(); }
  };
  const remove = async () => {
    setBusy(true);
    try { await adminApi.del(`/products/${del._id}`); notify.success('Product deleted'); setDel(null); reload(); } catch (e) { notify.error('Couldn’t delete', e.message); } finally { setBusy(false); }
  };
  const items = data?.items || [];

  return (
    <Guard perm="products:read">
      <PageHeader title="Products" subtitle="Everything you sell, with live stock." actions={can('products:create') && <Button as={NextLink} href="/admin/products/new" variant="dark" leftIcon={<Icon name="add" size={18} />}>New product</Button>} />
      <Flex gap={3} mb={4} direction={{ base: 'column', md: 'row' }}>
        <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search products" bg="white" maxW={{ md: '360px' }} aria-label="Search products" />
        <Select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }} bg="white" maxW={{ md: '240px' }} aria-label="Filter by category">
          <option value="">All categories</option>{(cats.data || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
      </Flex>
      {loading && !data ? <Loading /> : error ? <ErrorNote error={error} onRetry={reload} /> : (
        <>
          <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" overflow="hidden" opacity={loading ? 0.6 : 1} transition="opacity .2s">
            <TableContainer><Table>
              <Thead bg="ink.50"><Tr><Th>Product</Th><Th>SKU</Th><Th isNumeric>Price</Th><Th>Stock</Th><Th>Live</Th><Th w="1%" /></Tr></Thead>
              <Tbody>
                {items.length === 0 && <Tr><Td colSpan={6} textAlign="center" py={12} color="ink.500">No products found.</Td></Tr>}
                {items.map((p) => {
                  const pi = priceInfo(p);
                  return (
                    <Tr key={p._id} _hover={{ bg: 'ink.50' }}>
                      <Td whiteSpace="normal"><HStack spacing={3}><ProductImage product={p} width={120} w="44px" flexShrink={0} rounded="lg" />
                        <Box minW={0}><Text as={NextLink} href={`/admin/products/${p._id}`} fontWeight={700} noOfLines={1}>{p.name}</Text><Text fontSize="xs" color="ink.500">{p.brand_name || p.category_name}{p.requires_prescription ? ' · Rx' : ''}</Text></Box></HStack></Td>
                      <Td fontSize="sm" color="ink.600">{p.sku}</Td>
                      <Td isNumeric><Text fontWeight={800}>{money(pi.current)}</Text>{pi.old && <Text as="s" fontSize="xs" color="ink.400">{money(pi.old)}</Text>}</Td>
                      <Td><Pill color={p.stock_status === 'OUT_OF_STOCK' ? 'red' : p.stock_status === 'LOW_STOCK' ? 'orange' : 'green'}>{p.available_stock ?? 0} · {String(p.stock_status || 'IN_STOCK').replace(/_/g, ' ').toLowerCase()}</Pill></Td>
                      <Td><Switch colorScheme="pine" isChecked={!!p.active} onChange={() => toggle(p)} isDisabled={!can('products:update')} aria-label={`${p.name} live`} /></Td>
                      <Td><HStack spacing={1}>
                        <IconButton as={NextLink} href={`/admin/products/${p._id}`} aria-label="Edit product" icon={<Icon name="edit" size={18} />} size="sm" variant="ghost" />
                        {can('products:delete') && <IconButton aria-label="Delete product" icon={<Icon name="trash" size={18} />} size="sm" variant="ghost" color="coral.600" onClick={() => setDel(p)} />}
                      </HStack></Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table></TableContainer>
          </Box>
          <PagerLite page={data.meta?.page || 1} pages={data.meta?.pages || 1} onPage={setPage} />
        </>
      )}
      <ConfirmDialog isOpen={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={busy} danger title="Delete this product?" body={`“${del?.name}” will be removed permanently. To just hide it, switch it off instead.`} confirmLabel="Delete" />
    </Guard>
  );
}

function PagerLite({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <HStack justify="center" mt={5} spacing={2}>
      <Button size="sm" variant="outline" isDisabled={page <= 1} onClick={() => onPage(page - 1)} leftIcon={<Icon name="left" size={16} />}>Prev</Button>
      <Text fontSize="sm" fontWeight={700}>Page {page} of {pages}</Text>
      <Button size="sm" variant="outline" isDisabled={page >= pages} onClick={() => onPage(page + 1)} rightIcon={<Icon name="right" size={16} />}>Next</Button>
    </HStack>
  );
}
