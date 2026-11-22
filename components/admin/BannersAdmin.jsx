'use client';
import { useState } from 'react';
import { Box, Button, Flex, Grid, HStack, IconButton, Input, Select, Switch, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { AdminModal, ConfirmDialog, ErrorNote, Field, Guard, Loading, PageHeader, Pill, useLoad } from './ui';
import { useAdmin } from '@/context/AdminContext';
import { adminApi } from '@/lib/api';
import { fromISODate, toISODate } from '@/lib/admin';
import { useNotify } from '@/lib/hooks';

const PLACEMENTS = [['home-hero', 'Home page hero carousel'], ['shop-top', 'Top of shop pages'], ['shop-after-8', 'Shop: after 8 products'], ['shop-after-16', 'Shop: after 16 products'], ['shop-bottom', 'Bottom of shop'], ['category-top', 'Category top'], ['category-bottom', 'Category bottom'], ['product-top', 'Product page top'], ['product-bottom', 'Product page bottom'], ['checkout-top', 'Checkout top']];
const TYPES = [['carousel', 'Carousel'], ['single', 'Single'], ['grid', 'Grid'], ['sidebar', 'Sidebar'], ['announcement', 'Announcement']];
const blankAd = () => ({ title: '', subtitle: '', description: '', image_video_url: '', button_text: '', link: '', priority: 0, active: true });
const blank = { title: '', placement: 'home-hero', type: 'carousel', active: true, start_date: '', end_date: '', ads: [blankAd()] };

export default function BannersAdmin() {
  const { can } = useAdmin();
  const notify = useNotify();
  const { loading, data, error, reload } = useLoad(async () => (await adminApi.get('/banners')).data || [], []);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [del, setDel] = useState(null);
  const isEdit = editing && editing !== 'new';

  const open = (b) => {
    setEditing(b || 'new'); setErr('');
    setF(b ? { ...blank, ...b, start_date: fromISODate(b.start_date), end_date: fromISODate(b.end_date), ads: (b.ads || []).map((a) => ({ ...blankAd(), ...a })) } : { ...blank, ads: [blankAd()] });
  };
  const setAd = (i, patch) => setF((s) => ({ ...s, ads: s.ads.map((a, k) => (k === i ? { ...a, ...patch } : a)) }));

  const save = async () => {
    setErr('');
    if (!f.title.trim()) return setErr('Give the banner a name.');
    const ads = f.ads.filter((a) => a.title.trim() || a.image_video_url.trim());
    if (!ads.length) return setErr('Add at least one ad with a title and image link.');
    if (ads.some((a) => !a.title.trim() || !a.image_video_url.trim())) return setErr('Each ad needs a title and an image link.');
    const body = {
      title: f.title.trim(), placement: f.placement, type: f.type, active: !!f.active, start_date: toISODate(f.start_date), end_date: toISODate(f.end_date),
      ads: ads.map((a) => ({ title: a.title.trim(), subtitle: a.subtitle?.trim() || null, description: a.description?.trim() || null, media_type: /\.(mp4|webm)(\?|$)/i.test(a.image_video_url) ? 'video' : 'image',
        image_video_url: a.image_video_url.trim(), cloudinary_public_id: a.cloudinary_public_id || null, button_text: a.button_text?.trim() || null, link: a.link?.trim() || null, priority: Number(a.priority) || 0, active: !!a.active })),
    };
    setBusy(true);
    try {
      if (isEdit) await adminApi.put(`/banners/${editing._id}`, body); else await adminApi.post('/banners', body);
      notify.success(isEdit ? 'Banner updated' : 'Banner created'); setEditing(null); reload();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await adminApi.del(`/banners/${del._id}`); notify.success('Banner deleted'); setDel(null); reload(); } catch (e) { notify.error('Couldn’t delete', e.message); } finally { setBusy(false); }
  };

  return (
    <Guard perm="banners:read">
      <PageHeader title="Banners" subtitle="Promotions shown on the home page and around the shop." actions={can('banners:create') && <Button variant="dark" leftIcon={<Icon name="add" size={18} />} onClick={() => open()}>New banner</Button>} />
      {loading ? <Loading /> : error ? <ErrorNote error={error} onRetry={reload} /> : (
        <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" overflow="hidden">
          <TableContainer><Table>
            <Thead bg="ink.50"><Tr><Th>Banner</Th><Th>Placement</Th><Th isNumeric>Ads</Th><Th>Status</Th><Th w="1%" /></Tr></Thead>
            <Tbody>
              {data.length === 0 && <Tr><Td colSpan={5} textAlign="center" py={12} color="ink.500">No banners yet.</Td></Tr>}
              {data.map((b) => (
                <Tr key={b._id} _hover={{ bg: 'ink.50' }}>
                  <Td><Text fontWeight={700}>{b.title}</Text><Text fontSize="xs" color="ink.500">{b.type}</Text></Td>
                  <Td>{(PLACEMENTS.find(([v]) => v === b.placement) || [])[1] || b.placement}</Td>
                  <Td isNumeric>{(b.ads || []).length}</Td>
                  <Td><Pill color={b.active ? 'green' : 'gray'}>{b.active ? 'Live' : 'Off'}</Pill></Td>
                  <Td><HStack spacing={1}>
                    {can('banners:update') && <IconButton aria-label="Edit banner" icon={<Icon name="edit" size={18} />} size="sm" variant="ghost" onClick={() => open(b)} />}
                    {can('banners:delete') && <IconButton aria-label="Delete banner" icon={<Icon name="trash" size={18} />} size="sm" variant="ghost" color="coral.600" onClick={() => setDel(b)} />}
                  </HStack></Td>
                </Tr>
              ))}
            </Tbody>
          </Table></TableContainer>
        </Box>
      )}

      <AdminModal isOpen={!!editing} onClose={() => setEditing(null)} title={isEdit ? 'Edit banner' : 'New banner'} onSubmit={save} busy={busy} error={err} size="3xl">
        <VStack align="stretch" spacing={5}>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
            <Field label="Name (internal)" isRequired gridColumn={{ md: '1 / -1' }}><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Black Friday hero" /></Field>
            <Field label="Where it appears"><Select value={f.placement} onChange={(e) => setF({ ...f, placement: e.target.value })}>{PLACEMENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            <Field label="Style"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
            <Field label="Starts"><Input type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
            <Field label="Ends"><Input type="date" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></Field>
            <Flex align="center" gap={3}><Switch colorScheme="pine" size="lg" isChecked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /><Text fontWeight={600}>Live</Text></Flex>
          </Grid>
          <Flex justify="space-between" align="center"><Text fontFamily="heading" fontWeight={800} fontSize="lg">Ads</Text>
            <Button size="sm" variant="soft" leftIcon={<Icon name="add" size={16} />} onClick={() => setF((s) => ({ ...s, ads: [...s.ads, blankAd()] }))}>Add ad</Button></Flex>
          {f.ads.map((a, i) => (
            <Box key={i} border="1px solid" borderColor="ink.100" borderRadius="xl" p={4}>
              <Flex justify="space-between" mb={3} align="center"><Text fontWeight={700} color="ink.600">Ad {i + 1}</Text>
                <IconButton aria-label={`Remove ad ${i + 1}`} icon={<Icon name="trash" size={16} />} size="xs" variant="ghost" color="coral.600" isDisabled={f.ads.length === 1} onClick={() => setF((s) => ({ ...s, ads: s.ads.filter((_, k) => k !== i) }))} /></Flex>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                <Field label="Headline" isRequired><Input value={a.title} onChange={(e) => setAd(i, { title: e.target.value })} /></Field>
                <Field label="Small line above"><Input value={a.subtitle || ''} onChange={(e) => setAd(i, { subtitle: e.target.value })} /></Field>
                <Field label="Image or video link" isRequired gridColumn={{ md: '1 / -1' }}><Input value={a.image_video_url} onChange={(e) => setAd(i, { image_video_url: e.target.value })} placeholder="https://…" /></Field>
                <Field label="Text" gridColumn={{ md: '1 / -1' }}><Textarea rows={2} value={a.description || ''} onChange={(e) => setAd(i, { description: e.target.value })} /></Field>
                <Field label="Button label"><Input value={a.button_text || ''} onChange={(e) => setAd(i, { button_text: e.target.value })} placeholder="Shop now" /></Field>
                <Field label="Button link" help="e.g. /shop or /category/vitamins"><Input value={a.link || ''} onChange={(e) => setAd(i, { link: e.target.value })} /></Field>
                <Field label="Order (low = first)"><Input type="number" value={a.priority} onChange={(e) => setAd(i, { priority: e.target.value })} /></Field>
                <Flex align="center" gap={3} pt={{ md: 7 }}><Switch colorScheme="pine" isChecked={!!a.active} onChange={(e) => setAd(i, { active: e.target.checked })} /><Text fontWeight={600}>Show this ad</Text></Flex>
              </Grid>
            </Box>
          ))}
        </VStack>
      </AdminModal>
      <ConfirmDialog isOpen={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={busy} danger title="Delete this banner?" body={`“${del?.title}” and its ads will be removed.`} confirmLabel="Delete" />
    </Guard>
  );
}
