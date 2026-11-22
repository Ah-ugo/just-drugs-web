'use client';
import NextLink from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormHelperText, FormLabel, Grid, Heading, HStack, IconButton, Input, SimpleGrid, Text, Textarea, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { EmptyState, Page, RxStatusBadge } from '@/components/ui/Layout';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { fmtDate, isValidPhone, normalizePhone } from '@/lib/format';
import { useNotify } from '@/lib/hooks';

const MAX_FILES = 5;
const MAX_MB = 10;

export function MyPrescriptions({ reloadKey }) {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/prescriptions/my-prescriptions').then((r) => setList(r.data || [])).catch(() => setList([])); }, [reloadKey]);
  if (list === null) return null;
  if (!list.length) return <Text color="ink.500">No prescriptions yet.</Text>;
  return (
    <VStack align="stretch" spacing={3}>
      {list.map((p) => (
        <Box key={p._id} bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={4}>
          <HStack justify="space-between" flexWrap="wrap" mb={1}><Text fontWeight={800}>{p.prescription_number}</Text><RxStatusBadge status={p.status} /></HStack>
          <Text fontSize="sm" color="ink.500">Uploaded {fmtDate(p.created_at)}</Text>
          {p.pharmacist_notes && <Text mt={2} fontSize="sm"><b>Pharmacist:</b> {p.pharmacist_notes}</Text>}
          {p.rejection_reason && <Text mt={1} fontSize="sm" color="coral.600"><b>Reason:</b> {p.rejection_reason}</Text>}
          <HStack mt={3} spacing={2} overflowX="auto">
            {(p.files || []).map((f, i) => (
              <Box as="a" key={i} href={f.url} target="_blank" rel="noopener noreferrer" w="56px" h="56px" borderRadius="lg" overflow="hidden" bg="pine.50" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                {f.file_type === 'pdf' ? <Icon name="doc" size={24} /> : <img src={f.url} alt={`Prescription page ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </Box>
            ))}
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}

export default function PrescriptionsView() {
  const { isAuthed } = useAuth();
  const { refresh } = useCart();
  const { wa, prescriptionsEnabled } = useStore();
  const notify = useNotify();
  const gallery = useRef(null);
  const camera = useRef(null);
  const [files, setFiles] = useState([]);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => () => files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = (list) => {
    setErr('');
    const next = [...files];
    for (const file of Array.from(list || [])) {
      if (next.length >= MAX_FILES) { setErr(`You can upload up to ${MAX_FILES} files.`); break; }
      if (!/^image\//.test(file.type) && file.type !== 'application/pdf') { setErr('Only photos and PDF files are accepted.'); continue; }
      if (file.size > MAX_MB * 1024 * 1024) { setErr(`“${file.name}” is larger than ${MAX_MB}MB.`); continue; }
      next.push({ file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null });
    }
    setFiles(next);
  };
  const removeAt = (i) => setFiles((l) => { if (l[i].preview) URL.revokeObjectURL(l[i].preview); return l.filter((_, k) => k !== i); });

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!files.length) return setErr('Add a photo or PDF of your prescription.');
    if (!isAuthed && !isValidPhone(phone)) return setErr('Enter a phone number so our pharmacist can reach you.');
    setBusy(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f.file));
      if (!isAuthed) fd.append('guest_phone', normalizePhone(phone));
      if (notes.trim()) fd.append('notes', notes.trim());
      const r = await api.upload('/prescriptions/upload', fd);
      const item = r.data;
      const local = storage.getJSON('jd_rx', []);
      storage.setJSON('jd_rx', [{ id: item._id, number: item.prescription_number }, ...local].slice(0, 10));
      if (item.matched_products?.length) { storage.set('jd_has_cart', '1'); refresh(); }
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      setFiles([]); setNotes(''); setDone(item); setReloadKey((k) => k + 1);
      notify.success('Prescription sent', `Reference ${item.prescription_number}`);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <Page py={{ base: 6, md: 12 }} maxW="900px">
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }}>Upload your prescription</Heading>
      <Text color="ink.600" mt={2} mb={6} fontSize="lg">A pharmacist reviews every prescription before prescription-only medicines are released.</Text>

      {!prescriptionsEnabled ? (
        <EmptyState icon="doc" title="Send your prescription on WhatsApp" text="Online uploads are paused right now. Our pharmacist can review it on WhatsApp instead.">
          <Button as="a" href={wa('Hello 👋 I’d like to send my prescription.')} target="_blank" rel="noopener noreferrer" variant="wa" leftIcon={<WhatsAppIcon size={18} />}>Open WhatsApp</Button>
        </EmptyState>
      ) : done ? (
        <Box bg="white" border="1px solid" borderColor="pine.200" borderRadius="2xl" p={{ base: 5, md: 8 }}>
          <HStack spacing={3} color="pine.600" mb={2}><Icon name="check" size={28} variant="Bold" /><Heading as="h2" fontSize="2xl">Prescription received</Heading></HStack>
          <Text>Your reference is <b>{done.prescription_number}</b>. {isAuthed ? 'We’ll email you when the pharmacist has reviewed it.' : 'Keep this number — checkout will use it once it’s approved.'}</Text>
          {done.matched_products?.length > 0 && <Alert status="success" borderRadius="xl" mt={4} alignItems="start"><AlertIcon mt={1} /><Box><Text fontWeight={800}>We added matching medicines to your cart</Text><Text fontSize="sm">{done.matched_products.join(', ')}</Text></Box></Alert>}
          <HStack mt={6} spacing={3} flexWrap="wrap">
            <Button as={NextLink} href="/cart" variant="buy">Go to cart</Button>
            <Button variant="outline" onClick={() => setDone(null)}>Upload another</Button>
          </HStack>
        </Box>
      ) : (
        <Grid as="form" onSubmit={submit} templateColumns={{ base: '1fr', md: '1.2fr 1fr' }} gap={6} alignItems="start">
          <VStack align="stretch" spacing={4}>
            <Flex direction="column" align="center" justify="center" textAlign="center" gap={3} p={{ base: 6, md: 8 }} bg="white" border="2px dashed" borderColor="pine.300" borderRadius="3xl"
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
              <Flex w="64px" h="64px" borderRadius="full" bg="pine.50" color="pine.600" align="center" justify="center"><Icon name="upload" size={30} /></Flex>
              <Text fontFamily="heading" fontWeight={800} fontSize="xl">Add your prescription</Text>
              <Text color="ink.500" fontSize="sm">Photos or PDF · up to {MAX_FILES} files · {MAX_MB}MB each</Text>
              <HStack spacing={3} flexWrap="wrap" justify="center">
                <Button variant="buy" leftIcon={<Icon name="camera" size={18} />} onClick={() => camera.current?.click()}>Take a photo</Button>
                <Button variant="outline" leftIcon={<Icon name="gallery" size={18} />} onClick={() => gallery.current?.click()}>Choose files</Button>
              </HStack>
              <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              <input ref={gallery} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </Flex>
            {files.length > 0 && (
              <SimpleGrid columns={{ base: 3, sm: 4 }} spacing={3}>
                {files.map((f, i) => (
                  <Box key={i} position="relative" borderRadius="xl" overflow="hidden" bg="white" border="1px solid" borderColor="ink.100" sx={{ aspectRatio: '1 / 1' }}>
                    {f.preview ? <img src={f.preview} alt={`Selected file ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Flex h="100%" direction="column" align="center" justify="center" p={2} gap={1}><Icon name="doc" size={28} /><Text fontSize="xs" noOfLines={2} textAlign="center">{f.file.name}</Text></Flex>}
                    <IconButton aria-label={`Remove file ${i + 1}`} icon={<Icon name="close" size={16} />} size="xs" borderRadius="full" position="absolute" top={1} right={1} bg="whiteAlpha.900" onClick={() => removeAt(i)} />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </VStack>

          <VStack align="stretch" spacing={4} bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={{ base: 4, md: 6 }}>
            {!isAuthed && (
              <FormControl isRequired><FormLabel>Phone number</FormLabel><Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" />
                <FormHelperText>So the pharmacist can call if anything is unclear. <Text as={NextLink} href="/login?next=/prescriptions" color="pine.600" fontWeight={700}>Sign in</Text> to track approvals.</FormHelperText></FormControl>
            )}
            <FormControl><FormLabel>Note for the pharmacist (optional)</FormLabel><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Patient name, allergies, brand preference…" /></FormControl>
            {err && <Alert status="error" borderRadius="xl" role="alert"><AlertIcon />{err}</Alert>}
            <Button type="submit" variant="buy" size="lg" isLoading={busy} loadingText="Uploading…">Send to pharmacist</Button>
            <Button as="a" href={wa('Hello 👋 I’d like to send my prescription.')} target="_blank" rel="noopener noreferrer" variant="wa" leftIcon={<WhatsAppIcon size={20} />}>Rather send on WhatsApp</Button>
          </VStack>
        </Grid>
      )}

      {isAuthed && prescriptionsEnabled && <Box mt={12}><Heading as="h2" fontSize="2xl" mb={4}>Your prescriptions</Heading><MyPrescriptions reloadKey={reloadKey} /></Box>}
    </Page>
  );
}
