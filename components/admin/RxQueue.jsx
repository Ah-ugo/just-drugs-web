'use client';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertIcon, Box, Button, Collapse, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, Flex, HStack, IconButton, Input, Menu, MenuButton, MenuItem, MenuList, Text, Textarea, VStack, Wrap, WrapItem, useBreakpointValue } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { RxStatusBadge } from '@/components/ui/Layout';
import { ErrorNote, Guard, Loading, PageHeader, Panel, useLoad } from './ui';
import { useAdmin } from '@/context/AdminContext';
import { useStore } from '@/context/StoreContext';
import { adminApi } from '@/lib/api';
import { fmtDateTime, normalizePhone } from '@/lib/format';
import { timeAgo } from '@/lib/admin';
import { useNotify } from '@/lib/hooks';
import { waLink } from '@/lib/whatsapp';
import { siteOrigin } from '@/lib/config';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'need_better_image', label: 'Clearer photo' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

const REASONS = {
  reject: ['Prescription is expired', 'Not signed or stamped by a prescriber', 'Medicine not covered by this prescription', 'Details don’t match the order'],
  photo: ['Image is blurry — please retake in good light', 'Part of the prescription is cut off', 'Handwriting is not legible', 'Please upload all pages'],
};

const digits = (p) => normalizePhone(p).replace(/\D/g, '');

/* ---------- image viewer with zoom + rotate ---------- */
function Viewer({ files }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  useEffect(() => { setI(0); setZoom(1); setRot(0); }, [files]);
  const f = files[i];
  if (!f) return <Flex h="240px" bg="ink.50" borderRadius="xl" align="center" justify="center" color="ink.500">No file attached</Flex>;
  const isPdf = f.file_type === 'pdf' || /\.pdf($|\?)/i.test(f.url || '');
  return (
    <Box>
      <Flex gap={1} mb={2} align="center" flexWrap="wrap">
        <Text fontWeight={700} fontSize="sm" mr="auto">Page {i + 1} of {files.length}</Text>
        {!isPdf && <>
          <IconButton aria-label="Zoom out" icon={<Icon name="zoomout" size={18} />} size="sm" variant="outline" onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))} isDisabled={zoom <= 1} />
          <Text fontSize="sm" fontWeight={700} minW="44px" textAlign="center">{Math.round(zoom * 100)}%</Text>
          <IconButton aria-label="Zoom in" icon={<Icon name="zoomin" size={18} />} size="sm" variant="outline" onClick={() => setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)))} isDisabled={zoom >= 4} />
          <IconButton aria-label="Rotate" icon={<Icon name="rotate" size={18} />} size="sm" variant="outline" onClick={() => setRot((r) => (r + 90) % 360)} />
        </>}
        <IconButton as="a" href={f.url} target="_blank" rel="noopener noreferrer" aria-label="Open original" icon={<Icon name="external" size={18} />} size="sm" variant="outline" />
      </Flex>
      <Box bg="ink.900" borderRadius="xl" overflow="auto" h={{ base: '340px', lg: '460px' }} position="relative">
        {isPdf
          ? <Flex h="100%" direction="column" align="center" justify="center" gap={3} color="white"><Icon name="doc" size={48} /><Text>PDF document</Text><Button as="a" href={f.url} target="_blank" rel="noopener noreferrer" variant="buy" size="sm">Open PDF</Button></Flex>
          : <Box w={`${zoom * 100}%`} minH="100%" display="flex" alignItems="center" justifyContent="center" p={2}>
              <img src={f.url} alt={`Prescription page ${i + 1}`} style={{ width: '100%', height: 'auto', maxHeight: zoom === 1 ? '440px' : 'none', objectFit: 'contain', transform: `rotate(${rot}deg)`, transition: 'transform .2s' }} />
            </Box>}
      </Box>
      {files.length > 1 && (
        <HStack mt={2} spacing={2} overflowX="auto">
          {files.map((x, k) => (
            <Box as="button" type="button" key={k} onClick={() => { setI(k); setZoom(1); setRot(0); }} aria-label={`Show page ${k + 1}`} w="56px" h="56px" borderRadius="lg" overflow="hidden" flexShrink={0}
              border="2px solid" borderColor={k === i ? 'pine.500' : 'ink.200'} bg="white" display="flex" alignItems="center" justifyContent="center">
              {x.file_type === 'pdf' ? <Icon name="doc" size={22} /> : <img src={x.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </Box>
          ))}
        </HStack>
      )}
    </Box>
  );
}

/* ---------- review panel ---------- */
function ReviewPanel({ rx, onDone }) {
  const notify = useNotify();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { setNote(''); setErr(''); setBusy(''); }, [rx._id]);

  const submit = async (status) => {
    if (status === 'rejected' && note.trim().length < 3) return setErr('Give the customer a reason for rejecting.');
    if (status === 'need_better_image' && note.trim().length < 3) return setErr('Tell the customer what to fix in the photo.');
    setErr(''); setBusy(status);
    try {
      const r = await adminApi.patch(`/prescriptions/${rx._id}/status`, {
        status,
        pharmacist_notes: status === 'approved' ? (note.trim() || null) : null,
        rejection_reason: status === 'rejected' || status === 'need_better_image' ? note.trim() : null,
      });
      notify.success({ approved: 'Prescription approved', rejected: 'Prescription rejected', need_better_image: 'Customer asked for a clearer photo', expired: 'Marked as expired' }[status]);
      onDone(r.data, status);
    } catch (e) { setErr(e.message); } finally { setBusy(''); }
  };

  return (
    <Box>
      <Text fontWeight={800} mb={2}>Your decision</Text>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Note for the customer (required to reject or ask for a new photo)" bg="white" />
      <Wrap mt={2} spacing={1.5}>
        {[...REASONS.photo, ...REASONS.reject].map((r) => (
          <WrapItem key={r}><Button size="xs" variant="soft" fontWeight={600} onClick={() => setNote(r)}>{r}</Button></WrapItem>
        ))}
      </Wrap>
      {err && <Alert status="error" borderRadius="xl" mt={3} role="alert"><AlertIcon />{err}</Alert>}
      <Flex gap={2} mt={4} flexWrap="wrap">
        <Button flex="1 1 140px" variant="dark" bg="pine.600" leftIcon={<Icon name="check" size={18} variant="Bold" />} isLoading={busy === 'approved'} isDisabled={!!busy} onClick={() => submit('approved')}>Approve</Button>
        <Button flex="1 1 140px" variant="buy" leftIcon={<Icon name="camera" size={18} />} isLoading={busy === 'need_better_image'} isDisabled={!!busy} onClick={() => submit('need_better_image')}>Clearer photo</Button>
        <Button flex="1 1 140px" bg="coral.500" color="white" _hover={{ bg: 'coral.600' }} leftIcon={<Icon name="close" size={18} />} isLoading={busy === 'rejected'} isDisabled={!!busy} onClick={() => submit('rejected')}>Reject</Button>
        <Menu><MenuButton as={IconButton} aria-label="More actions" icon={<Icon name="down" size={18} />} variant="outline" isDisabled={!!busy} />
          <MenuList><MenuItem onClick={() => submit('expired')}>Mark as expired</MenuItem></MenuList></Menu>
      </Flex>
    </Box>
  );
}

/* ---------- detail ---------- */
function Detail({ rx, onReviewed, onNext, storeName }) {
  const [text, setText] = useState(false);
  const [sent, setSent] = useState(null);
  useEffect(() => { setSent(null); setText(false); }, [rx._id]);

  const phone = rx.guest_phone ? normalizePhone(rx.guest_phone) : null;
  const msg = (status, note) => ({
    approved: `Hello 👋 Your prescription ${rx.prescription_number} has been approved ✅ at ${storeName}. You can now complete your order: ${siteOrigin()}/checkout`,
    rejected: `Hello 👋 We couldn’t approve prescription ${rx.prescription_number} at ${storeName}. Reason: ${note || 'see details'}. Please contact us if you have questions.`,
    need_better_image: `Hello 👋 We need a clearer photo of prescription ${rx.prescription_number}. ${note || ''} Please upload it again: ${siteOrigin()}/prescriptions`,
    expired: `Hello 👋 Prescription ${rx.prescription_number} has expired. Please send a new one: ${siteOrigin()}/prescriptions`,
  }[status]);

  return (
    <VStack align="stretch" spacing={5}>
      <Flex justify="space-between" gap={3} flexWrap="wrap" align="start">
        <Box><Text fontFamily="heading" fontWeight={800} fontSize="2xl">{rx.prescription_number}</Text>
          <Text color="ink.500" fontSize="sm">Uploaded {fmtDateTime(rx.created_at)} · {timeAgo(rx.created_at)}</Text></Box>
        <RxStatusBadge status={rx.status} />
      </Flex>

      <Flex gap={3} p={3.5} bg="pine.50" borderRadius="xl" align="center" flexWrap="wrap">
        <Box flex={1} minW="180px">
          <Text fontSize="xs" color="ink.500" fontWeight={700}>CUSTOMER</Text>
          <Text fontWeight={700}>{phone || (rx.user_id ? 'Registered customer' : 'Unknown')}</Text>
          {rx.user_id && <Text fontSize="xs" color="ink.500">Account ID …{String(rx.user_id).slice(-6)} · updates are emailed</Text>}
        </Box>
        {phone && <HStack>
          <Button as="a" href={`tel:${phone}`} size="sm" variant="outline" leftIcon={<Icon name="call" size={16} />}>Call</Button>
          <Button as="a" href={waLink(`Hello 👋 This is the ${storeName} pharmacist about prescription ${rx.prescription_number}.`, digits(phone))} target="_blank" rel="noopener noreferrer" size="sm" variant="wa" leftIcon={<WhatsAppIcon size={16} />}>WhatsApp</Button>
        </HStack>}
      </Flex>

      {rx.notes && <Box p={3.5} bg="gold.50" borderRadius="xl"><Text fontSize="xs" color="ink.500" fontWeight={700}>CUSTOMER NOTE</Text><Text>{rx.notes}</Text></Box>}

      <Viewer files={rx.files || []} />

      {rx.extracted_text && (
        <Box><Button size="xs" variant="ghost" onClick={() => setText((t) => !t)} rightIcon={<Icon name={text ? 'up' : 'down'} size={14} />}>Text read from the image (auto)</Button>
          <Collapse in={text}><Text mt={2} p={3} bg="ink.50" borderRadius="lg" fontSize="sm" whiteSpace="pre-wrap">{rx.extracted_text}</Text></Collapse></Box>
      )}

      {rx.reviewed_at && (
        <Box p={3.5} border="1px solid" borderColor="ink.100" borderRadius="xl" fontSize="sm">
          <Text fontWeight={700}>Last reviewed {fmtDateTime(rx.reviewed_at)}</Text>
          {rx.pharmacist_notes && <Text color="ink.700">Note: {rx.pharmacist_notes}</Text>}
          {rx.rejection_reason && <Text color="coral.600">Reason: {rx.rejection_reason}</Text>}
        </Box>
      )}

      {sent ? (
        <Alert status="success" borderRadius="xl" alignItems="start" flexDirection="column" gap={2}>
          <HStack><AlertIcon /><Text fontWeight={800}>Decision saved</Text></HStack>
          {phone ? <Button as="a" href={waLink(msg(sent.status, sent.note), digits(phone))} target="_blank" rel="noopener noreferrer" variant="wa" size="sm" leftIcon={<WhatsAppIcon size={16} />}>Tell {phone} on WhatsApp</Button>
            : <Text fontSize="sm">The customer has been emailed.</Text>}
          {onNext && <Button size="sm" variant="dark" rightIcon={<Icon name="right" size={16} />} onClick={onNext}>Next prescription</Button>}
        </Alert>
      ) : null}

      <ReviewPanel rx={rx} onDone={(updated, status) => { setSent({ status, note: updated.rejection_reason || updated.pharmacist_notes }); onReviewed(updated); }} />
    </VStack>
  );
}

/* ---------- page ---------- */
export default function RxQueue() {
  const { isRole } = useAdmin();
  const { storeName } = useStore();
  const { loading, data, error, reload, setData } = useLoad(async () => (await adminApi.get('/prescriptions/pharmacist/queue')).data || [], [], { poll: 45000 });
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const isDesktop = useBreakpointValue({ base: false, lg: true }, { ssr: false });

  const all = data || [];
  const counts = useMemo(() => { const c = { all: all.length }; all.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; }); return c; }, [all]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    let l = all.filter((r) => (tab === 'all' || r.status === tab) && (!term || `${r.prescription_number} ${r.guest_phone || ''}`.toLowerCase().includes(term)));
    // oldest-first for the work queue so nobody waits longest
    if (tab === 'pending') l = [...l].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return l;
  }, [all, tab, q]);

  // keep a valid selection on desktop (auto-open the first item)
  // (a reviewed item stays open even though it leaves the Pending tab, so the pharmacist can notify the customer)
  useEffect(() => {
    if (!isDesktop) return;
    if (!sel || !all.some((r) => r._id === sel)) setSel(list[0]?._id || null);
  }, [list, all, isDesktop]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = all.find((r) => r._id === sel) || null;

  const onReviewed = (updated) => setData((d) => (d || []).map((r) => (r._id === updated._id ? { ...r, ...updated } : r)));
  const nextPending = all.filter((r) => r.status === 'pending' && r._id !== sel).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
  const onNext = nextPending ? () => { setTab('pending'); setSel(nextPending._id); } : null;

  return (
    <Guard perm="prescription:review">
      <PageHeader title="Prescriptions" subtitle="Review uploaded prescriptions before prescription-only medicines are released."
        actions={<Button variant="outline" leftIcon={<Icon name="refresh" size={18} />} onClick={reload}>Refresh</Button>} />
      {!isRole('pharmacist') && !isRole('super_admin') && (
        <Alert status="warning" borderRadius="xl" mb={5} bg="gold.50" alignItems="start"><AlertIcon color="gold.600" mt={1} />
          <Text fontSize="sm">The API currently accepts reviews only from staff with <b>prescription:review</b> permissions. You can browse the queue, but saving a decision may be refused.</Text></Alert>
      )}
      {loading ? <Loading /> : error ? <ErrorNote error={error} onRetry={reload} /> : (
        <Flex gap={5} align="flex-start">
          <Box w={{ base: '100%', lg: '380px' }} flexShrink={0}>
            <Wrap spacing={1.5} mb={3}>
              {TABS.map((t) => (
                <WrapItem key={t.key}><Button size="sm" variant={tab === t.key ? 'dark' : 'outline'} onClick={() => setTab(t.key)}>
                  {t.label}<Box as="span" ml={1.5} px={1.5} borderRadius="full" bg={tab === t.key ? 'whiteAlpha.300' : 'ink.100'} fontSize="xs">{counts[t.key] || 0}</Box></Button></WrapItem>
              ))}
            </Wrap>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by number or phone" bg="white" mb={3} aria-label="Search prescriptions" />
            <VStack align="stretch" spacing={2} maxH={{ lg: 'calc(100vh - 330px)' }} overflowY="auto" pr={{ lg: 1 }}>
              {list.length === 0 && <Panel textAlign="center" color="ink.500">{tab === 'pending' ? 'All caught up — nothing waiting 🎉' : 'Nothing here.'}</Panel>}
              {list.map((r) => {
                const active = r._id === sel;
                return (
                  <Box as="button" type="button" key={r._id} onClick={() => setSel(r._id)} textAlign="left" bg="white" p={3.5} borderRadius="xl" border="1px solid"
                    borderColor={active ? 'pine.500' : 'ink.100'} boxShadow={active ? '0 0 0 2px rgba(27,127,90,.2)' : 'none'} borderLeft="4px solid" borderLeftColor={r.status === 'pending' ? 'gold.400' : active ? 'pine.500' : 'ink.100'}>
                    <Flex justify="space-between" gap={2}><Text fontWeight={800}>{r.prescription_number}</Text><RxStatusBadge status={r.status} /></Flex>
                    <Text fontSize="sm" color="ink.600">{r.guest_phone ? normalizePhone(r.guest_phone) : 'Registered customer'}</Text>
                    <Text fontSize="xs" color="ink.500">{timeAgo(r.created_at)} · {(r.files || []).length} file{(r.files || []).length === 1 ? '' : 's'}</Text>
                  </Box>
                );
              })}
            </VStack>
          </Box>

          {isDesktop && (
            <Box flex={1} minW={0} bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={6}>
              {current ? <Detail rx={current} onReviewed={onReviewed} onNext={onNext} storeName={storeName} /> : <Flex h="300px" align="center" justify="center" color="ink.500">Select a prescription to review</Flex>}
            </Box>
          )}
        </Flex>
      )}

      {!isDesktop && (
        <Drawer isOpen={!!current} placement="bottom" onClose={() => setSel(null)} size="full">
          <DrawerOverlay />
          <DrawerContent><DrawerCloseButton /><DrawerHeader fontFamily="heading">Review prescription</DrawerHeader>
            <DrawerBody pb={8}>{current && <Detail rx={current} onReviewed={onReviewed} onNext={onNext} storeName={storeName} />}</DrawerBody></DrawerContent>
        </Drawer>
      )}
    </Guard>
  );
}
