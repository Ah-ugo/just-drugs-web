'use client';
import NextLink from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertIcon, Box, Button, Checkbox, Flex, FormControl, FormErrorMessage, FormLabel, Grid, Heading, HStack, IconButton, Input, Select, Tab, TabList, TabPanel, TabPanels, Tabs, Text, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { EmptyState, OrderStatusBadge, Page } from '@/components/ui/Layout';
import { MyPrescriptions } from './PrescriptionsView';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { api } from '@/lib/api';
import { fmtDate, isValidPhone, money, normalizePhone, NIGERIAN_STATES } from '@/lib/format';
import { useNotify } from '@/lib/hooks';
import { siteOrigin } from '@/lib/config';

const Card = (p) => <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={{ base: 4, md: 6 }} {...p} />;

function OrdersTab() {
  const [orders, setOrders] = useState(null);
  const { add, drawer } = useCart();
  const notify = useNotify();
  useEffect(() => { api.get('/orders/my-orders', { limit: 50 }).then((r) => setOrders(r.data || [])).catch(() => setOrders([])); }, []);

  const buyAgain = async (o) => {
    let n = 0;
    for (const it of o.items) { if (it.product_id && (await add({ _id: it.product_id, name: it.product_name }, it.quantity, { openDrawer: false }))) n += 1; }
    if (n) drawer.onOpen(); else notify.error('Those items aren’t available right now');
  };

  if (orders === null) return <Text color="ink.500">Loading your orders…</Text>;
  if (!orders.length) return <EmptyState icon="box" title="No orders yet" text="When you place an order it will show up here."><Button as={NextLink} href="/shop" variant="buy">Start shopping</Button></EmptyState>;
  return (
    <VStack align="stretch" spacing={3}>
      {orders.map((o) => (
        <Card key={o._id || o.order_number}>
          <Flex justify="space-between" gap={3} flexWrap="wrap" mb={2}>
            <Box><Text fontWeight={800}>{o.order_number}</Text><Text fontSize="sm" color="ink.500">{fmtDate(o.created_at)} · {o.items.length} item{o.items.length === 1 ? '' : 's'}</Text></Box>
            <Box textAlign="right"><OrderStatusBadge status={o.status} /><Text fontFamily="heading" fontWeight={800} fontSize="lg" mt={1}>{money(o.total_amount)}</Text></Box>
          </Flex>
          <Text fontSize="sm" color="ink.600" noOfLines={2}>{o.items.map((i) => `${i.product_name} × ${i.quantity}`).join(', ')}</Text>
          <HStack mt={4} spacing={2} flexWrap="wrap">
            <Button as={NextLink} href={`/orders/${o.order_number}`} size="sm" variant="dark">Track</Button>
            <Button as={NextLink} href={`/orders/${o.order_number}/invoice`} size="sm" variant="outline" leftIcon={<Icon name="receipt" size={15} />}>Invoice</Button>
            <Button size="sm" variant="soft" onClick={() => buyAgain(o)} leftIcon={<Icon name="refresh" size={15} />}>Buy again</Button>
          </HStack>
        </Card>
      ))}
    </VStack>
  );
}

function AddressesTab() {
  const { user, setUser } = useAuth();
  const notify = useNotify();
  const empty = { label: 'Home', full_name: '', phone: '', address_line: '', city: '', state: '', is_default: false };
  const [f, setF] = useState(empty);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.full_name.trim() || f.address_line.trim().length < 5 || !f.city.trim() || !f.state) return setErr('Fill in every field.');
    if (!isValidPhone(f.phone)) return setErr('Enter a valid phone number.');
    setBusy(true);
    try { const r = await api.post('/users/me/addresses', { ...f, phone: normalizePhone(f.phone) }); setUser(r.data); setF(empty); setOpen(false); notify.success('Address saved'); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  const del = async (id) => {
    try { const r = await api.del(`/users/me/addresses/${id}`); setUser(r.data); notify.success('Address removed'); } catch (e) { notify.error(e.message); }
  };

  return (
    <VStack align="stretch" spacing={3}>
      {(user.addresses || []).map((a) => (
        <Card key={a._id}>
          <HStack justify="space-between" align="start">
            <Box><Text fontWeight={800}>{a.label} {a.is_default && <Text as="span" fontSize="xs" color="pine.600">· Default</Text>}</Text>
              <Text>{a.full_name} · {a.phone}</Text><Text color="ink.600" fontSize="sm">{a.address_line}, {a.city}, {a.state}</Text></Box>
            <IconButton aria-label="Delete address" icon={<Icon name="trash" size={18} />} variant="ghost" color="coral.600" onClick={() => del(a._id)} />
          </HStack>
        </Card>
      ))}
      {!open ? <Button alignSelf="flex-start" variant="soft" leftIcon={<Icon name="add" size={18} />} onClick={() => setOpen(true)}>Add an address</Button> : (
        <Card as="form" onSubmit={save}>
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
            <FormControl><FormLabel>Label</FormLabel><Input value={f.label} onChange={set('label')} placeholder="Home, Office…" /></FormControl>
            <FormControl><FormLabel>Receiver’s name</FormLabel><Input value={f.full_name} onChange={set('full_name')} /></FormControl>
            <FormControl><FormLabel>Phone</FormLabel><Input type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} /></FormControl>
            <FormControl><FormLabel>City / Town</FormLabel><Input value={f.city} onChange={set('city')} /></FormControl>
            <FormControl gridColumn={{ md: '1 / -1' }}><FormLabel>Street address</FormLabel><Input value={f.address_line} onChange={set('address_line')} /></FormControl>
            <FormControl><FormLabel>State</FormLabel><Select placeholder="Select state" value={f.state} onChange={set('state')}>{NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select></FormControl>
            <Checkbox colorScheme="pine" alignSelf="end" pb={3} isChecked={f.is_default} onChange={set('is_default')}>Make default</Checkbox>
          </Grid>
          {err && <Alert status="error" borderRadius="xl" mt={4}><AlertIcon />{err}</Alert>}
          <HStack mt={4}><Button type="submit" variant="dark" isLoading={busy}>Save address</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></HStack>
        </Card>
      )}
    </VStack>
  );
}

function ProfileTab() {
  const { user, setUser } = useAuth();
  const { wa, storeName } = useStore();
  const notify = useNotify();
  const [f, setF] = useState({ first_name: user.first_name, last_name: user.last_name, phone: user.phone || '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const save = async (e) => {
    e.preventDefault(); setErr('');
    if (!isValidPhone(f.phone)) return setErr('Enter a valid phone number.');
    setBusy(true);
    try { const r = await api.patch('/users/me', { ...f, phone: normalizePhone(f.phone) }); setUser(r.data); notify.success('Profile updated'); } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  const refUrl = `${siteOrigin()}/register?ref=${user.referral_code}`;
  return (
    <VStack align="stretch" spacing={4}>
      <Card as="form" onSubmit={save}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <FormControl><FormLabel>First name</FormLabel><Input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></FormControl>
          <FormControl><FormLabel>Last name</FormLabel><Input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></FormControl>
          <FormControl><FormLabel>Email</FormLabel><Input value={user.email} isReadOnly bg="ink.50" /></FormControl>
          <FormControl><FormLabel>Phone</FormLabel><Input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></FormControl>
        </Grid>
        {err && <Alert status="error" borderRadius="xl" mt={4}><AlertIcon />{err}</Alert>}
        <Button type="submit" variant="dark" mt={4} isLoading={busy}>Save changes</Button>
      </Card>
      {user.referral_code && (
        <Card>
          <HStack spacing={3} mb={2}><Icon name="gift" size={22} /><Heading as="h3" fontSize="lg">Invite friends</Heading></HStack>
          <Text color="ink.600" mb={3}>Your referral code is <b>{user.referral_code}</b>. Share it so friends can sign up with it.</Text>
          <Button as="a" href={wa(`Join ${storeName} and order medicines online. Use my code ${user.referral_code}: ${refUrl}`)} target="_blank" rel="noopener noreferrer" variant="wa" size="sm" leftIcon={<WhatsAppIcon size={18} />}>Share on WhatsApp</Button>
        </Card>
      )}
    </VStack>
  );
}

function SecurityTab() {
  const notify = useNotify();
  const [f, setF] = useState({ current_password: '', new_password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault(); setErr('');
    if (f.new_password.length < 8 || !/[A-Z]/.test(f.new_password) || !/[0-9]/.test(f.new_password)) return setErr('New password needs 8+ characters, a capital letter and a number.');
    setBusy(true);
    try { await api.post('/users/me/change-password', f); setF({ current_password: '', new_password: '' }); notify.success('Password changed'); } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <Card as="form" onSubmit={save} maxW="480px">
      <VStack align="stretch" spacing={4}>
        <FormControl><FormLabel>Current password</FormLabel><Input type="password" autoComplete="current-password" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} /></FormControl>
        <FormControl><FormLabel>New password</FormLabel><Input type="password" autoComplete="new-password" value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} /></FormControl>
        {err && <Alert status="error" borderRadius="xl"><AlertIcon />{err}</Alert>}
        <Button type="submit" variant="dark" isLoading={busy}>Change password</Button>
      </VStack>
    </Card>
  );
}

const TABS = ['orders', 'prescriptions', 'addresses', 'profile', 'security'];

export default function AccountView() {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const idx = Math.max(0, TABS.indexOf(sp.get('tab') || 'orders'));

  useEffect(() => { if (status === 'guest') router.replace('/login?next=/account'); }, [status, router]);
  if (!user) return <Page py={16}><Text color="ink.500">Loading your account…</Text></Page>;

  return (
    <Page py={{ base: 5, md: 10 }} maxW="1000px">
      <Flex justify="space-between" align="start" gap={4} mb={6} flexWrap="wrap">
        <Box><Text color="ink.500" fontWeight={600}>Welcome back</Text><Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }}>{user.first_name} {user.last_name}</Heading></Box>
        <Button variant="outline" onClick={async () => { await logout(); router.push('/'); }} leftIcon={<Icon name="logout" size={18} />}>Sign out</Button>
      </Flex>
      {!user.is_email_verified && <Alert status="info" borderRadius="xl" mb={5} bg="gold.50"><AlertIcon color="gold.600" />Please verify your email — we sent you a link when you registered.</Alert>}
      {user.loyalty_points > 0 && <Alert status="success" borderRadius="xl" mb={5}><AlertIcon />You have {user.loyalty_points} loyalty points.</Alert>}
      <Tabs variant="pill" index={idx} onChange={(i) => router.replace(`/account?tab=${TABS[i]}`, { scroll: false })} isLazy>
        <TabList><Tab>Orders</Tab><Tab>Prescriptions</Tab><Tab>Addresses</Tab><Tab>Profile</Tab><Tab>Security</Tab></TabList>
        <TabPanels mt={5}>
          <TabPanel><OrdersTab /></TabPanel>
          <TabPanel><Button as={NextLink} href="/prescriptions" variant="buy" mb={5} leftIcon={<Icon name="upload" size={18} />}>Upload new</Button><MyPrescriptions /></TabPanel>
          <TabPanel><AddressesTab /></TabPanel>
          <TabPanel><ProfileTab /></TabPanel>
          <TabPanel><SecurityTab /></TabPanel>
        </TabPanels>
      </Tabs>
    </Page>
  );
}
