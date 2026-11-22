'use client';
import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertIcon, Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Grid, Heading, HStack, Input, Radio, RadioGroup, Select, Text, Textarea, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { EmptyState, Page } from '@/components/ui/Layout';
import OrderSummary, { useTotals } from './OrderSummary';
import CouponBox from './CouponBox';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { api } from '@/lib/api';
import { useCoupon } from '@/lib/coupon';
import { storage } from '@/lib/storage';
import { isEmail, isValidPhone, money, normalizePhone, NIGERIAN_STATES } from '@/lib/format';
import { cartOrderMessage } from '@/lib/whatsapp';
import { siteOrigin } from '@/lib/config';

const Step = ({ n, title, children }) => (
  <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={{ base: 4, md: 6 }}>
    <HStack spacing={3} mb={4}>
      <Flex w="30px" h="30px" borderRadius="full" bg="pine.800" color="white" fontFamily="heading" fontWeight={800} align="center" justify="center" fontSize="sm">{n}</Flex>
      <Heading as="h2" fontSize="xl">{title}</Heading>
    </HStack>
    {children}
  </Box>
);

const Field = ({ label, error, help, children, ...r }) => (
  <FormControl isInvalid={!!error} {...r}>
    <FormLabel>{label}</FormLabel>
    {children}
    {error ? <FormErrorMessage>{error}</FormErrorMessage> : help ? <FormHelperText>{help}</FormHelperText> : null}
  </FormControl>
);

export default function CheckoutView() {
  const router = useRouter();
  const { items, subtotal, requiresRx, ready } = useCart();
  const { user, isAuthed, status } = useAuth();
  const { wa, prescriptionsEnabled } = useStore();
  const { coupon, apply, remove: removeCoupon } = useCoupon();
  const totals = useTotals(subtotal, coupon);

  const [f, setF] = useState({ name: '', email: '', phone: '', recipient: '', street: '', city: '', state: '', notes: '', zone: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [zones, setZones] = useState([]);
  const [rx, setRx] = useState({ list: [], selected: '' });
  const [addrChoice, setAddrChoice] = useState('new');

  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  useEffect(() => {
    if (isAuthed && user) setF((s) => ({ ...s, name: s.name || `${user.first_name} ${user.last_name}`, phone: s.phone || user.phone || '', recipient: s.recipient || `${user.first_name} ${user.last_name}` }));
  }, [isAuthed, user]);

  useEffect(() => { api.get('/delivery/zones', null, { auth: false, guest: false }).then((r) => setZones(r.data || [])).catch(() => {}); }, []);

  useEffect(() => {
    if (!requiresRx || status === 'loading') return;
    if (isAuthed) {
      api.get('/prescriptions/my-prescriptions').then((r) => {
        const ok = (r.data || []).filter((p) => p.status === 'approved');
        setRx({ list: ok.map((p) => ({ id: p._id, number: p.prescription_number })), selected: ok[0]?._id || '' });
      }).catch(() => {});
    } else {
      const local = storage.getJSON('jd_rx', []);
      setRx({ list: local, selected: local[0]?.id || '' });
    }
  }, [requiresRx, isAuthed, status]);

  const saved = user?.addresses || [];
  useEffect(() => {
    if (saved.length && addrChoice === 'new' && !f.street) {
      const d = saved.find((a) => a.is_default) || saved[0];
      pickSaved(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.length]);

  function pickSaved(a) {
    setAddrChoice(a._id);
    setF((s) => ({ ...s, recipient: a.full_name, phone: a.phone, street: a.address_line, city: a.city, state: a.state, zone: a.delivery_zone_id || s.zone }));
  }

  const zone = useMemo(() => zones.find((z) => z._id === f.zone), [zones, f.zone]);

  function validate() {
    const e = {};
    if (!isAuthed) {
      if (f.name.trim().length < 2) e.name = 'Enter your full name.';
      if (!isEmail(f.email)) e.email = 'Enter a valid email — we send your receipt here.';
    }
    if (!isValidPhone(f.phone)) e.phone = 'Enter a valid phone number, e.g. 0803 123 4567.';
    if (f.recipient.trim().length < 2) e.recipient = 'Who should receive the delivery?';
    if (f.street.trim().length < 5) e.street = 'Enter the street address, including house number.';
    if (f.city.trim().length < 2) e.city = 'Enter your city or town.';
    if (!f.state) e.state = 'Choose your state.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function pay() {
    setFormError('');
    if (!validate()) { setFormError('Please fix the highlighted fields.'); return; }
    if (requiresRx && isAuthed && !rx.selected) { setFormError('Your cart has prescription-only items. Upload your prescription and wait for pharmacist approval, or order on WhatsApp.'); return; }
    setBusy(true);
    try {
      const phone = normalizePhone(f.phone);
      const body = {
        delivery_address: {
          recipient_name: f.recipient.trim(), phone, street_address: f.street.trim(), city: f.city.trim(), state: f.state, country: 'Nigeria',
          additional_notes: f.notes.trim() || null,
        },
        delivery_zone_id: f.zone || null,
        coupon_code: coupon?.code || null,
        prescription_id: requiresRx && rx.selected ? rx.selected : null,
        notes: f.notes.trim() || null,
      };
      if (!isAuthed) body.guest_info = { name: f.name.trim(), email: f.email.trim().toLowerCase(), phone };
      const r = await api.post('/orders/checkout', body);
      const d = r.data;
      storage.setJSON('jd_last_order', { order_number: d.order_number, reference: d.payment_reference, phone });
      // Without a Paystack key the backend returns a placeholder URL; go straight to verification in that case.
      if (!d.payment_url || d.payment_url.includes('/mock-')) router.push(`/checkout/verify?reference=${encodeURIComponent(d.payment_reference)}`);
      else window.location.href = d.payment_url;
    } catch (e) {
      const fe = e.fieldErrors || {};
      const mapped = {};
      if (fe.phone) mapped.phone = fe.phone;
      if (fe.email) mapped.email = fe.email;
      if (Object.keys(mapped).length) setErrors((x) => ({ ...x, ...mapped }));
      setFormError(e.message);
      setBusy(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (ready && items.length === 0) {
    return <Page py={8}><EmptyState icon="cart" title="Nothing to check out yet" text="Add a medicine to your cart first."><Button as={NextLink} href="/shop" variant="buy">Shop medicines</Button></EmptyState></Page>;
  }

  const msg = cartOrderMessage({ items, subtotal, requiresRx, origin: siteOrigin(), customer: { name: f.name || f.recipient, phone: f.phone } });

  return (
    <Page py={{ base: 5, md: 10 }}>
      <Heading as="h1" fontSize={{ base: '3xl', md: '5xl' }} mb={2}>Checkout</Heading>
      <Text color="ink.600" mb={6}>{isAuthed ? `Signed in as ${user?.email}` : <>Checking out as a guest. <Text as={NextLink} href="/login?next=/checkout" color="pine.600" fontWeight={700}>Sign in</Text> to use saved addresses.</>}</Text>

      {formError && <Alert status="error" borderRadius="xl" mb={5} role="alert"><AlertIcon />{formError}</Alert>}

      <Grid templateColumns={{ base: '1fr', lg: '1fr 400px' }} gap={{ base: 5, lg: 8 }} alignItems="start">
        <VStack align="stretch" spacing={5}>
          <Step n={1} title="Your contact details">
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              {!isAuthed && <Field label="Full name" error={errors.name}><Input value={f.name} onChange={set('name')} autoComplete="name" /></Field>}
              {!isAuthed && <Field label="Email" error={errors.email} help="Your receipt and order updates go here."><Input type="email" inputMode="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>}
              <Field label="Phone number" error={errors.phone} help="The rider will call this number."><Input type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="0803 123 4567" /></Field>
            </Grid>
          </Step>

          <Step n={2} title="Delivery address">
            {saved.length > 0 && (
              <RadioGroup value={addrChoice} onChange={(v) => (v === 'new' ? (setAddrChoice('new'), setF((s) => ({ ...s, street: '', city: '', state: '' }))) : pickSaved(saved.find((a) => a._id === v)))} mb={5}>
                <VStack align="stretch" spacing={2}>
                  {saved.map((a) => (
                    <Radio key={a._id} value={a._id} colorScheme="pine" alignItems="start" p={3} border="1px solid" borderColor={addrChoice === a._id ? 'pine.400' : 'ink.200'} borderRadius="xl" bg={addrChoice === a._id ? 'pine.50' : 'white'}>
                      <Text fontWeight={700}>{a.label} · {a.full_name}</Text><Text fontSize="sm" color="ink.600">{a.address_line}, {a.city}, {a.state}</Text>
                    </Radio>
                  ))}
                  <Radio value="new" colorScheme="pine" p={3} border="1px solid" borderColor={addrChoice === 'new' ? 'pine.400' : 'ink.200'} borderRadius="xl"><Text fontWeight={700}>Use a different address</Text></Radio>
                </VStack>
              </RadioGroup>
            )}
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              <Field label="Receiver’s name" error={errors.recipient} gridColumn={{ md: '1 / -1' }}><Input value={f.recipient} onChange={set('recipient')} autoComplete="name" /></Field>
              <Field label="Street address" error={errors.street} gridColumn={{ md: '1 / -1' }}><Input value={f.street} onChange={set('street')} autoComplete="street-address" placeholder="House number, street, area / landmark" /></Field>
              <Field label="City / Town" error={errors.city}><Input value={f.city} onChange={set('city')} autoComplete="address-level2" /></Field>
              <Field label="State" error={errors.state}>
                <Select placeholder="Select state" value={f.state} onChange={set('state')} autoComplete="address-level1">{NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}</Select>
              </Field>
              {zones.length > 0 && (
                <Field label="Delivery area (optional)" gridColumn={{ md: '1 / -1' }} help={zone ? `Estimated delivery: ${zone.estimated_delivery_time}` : 'Pick the zone closest to you for a delivery estimate.'}>
                  <Select placeholder="Select area" value={f.zone} onChange={set('zone')}>{zones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}</Select>
                </Field>
              )}
              <Field label="Note for the rider (optional)" gridColumn={{ md: '1 / -1' }}><Textarea rows={2} value={f.notes} onChange={set('notes')} placeholder="e.g. Call when you reach the gate" /></Field>
            </Grid>
          </Step>

          {requiresRx && (
            <Step n={3} title="Prescription">
              {rx.list.length > 0 ? (
                <FormControl>
                  <FormLabel>{isAuthed ? 'Approved prescriptions' : 'Prescriptions you uploaded on this device'}</FormLabel>
                  <Select value={rx.selected} onChange={(e) => setRx((s) => ({ ...s, selected: e.target.value }))}>{rx.list.map((p) => <option key={p.id} value={p.id}>{p.number}</option>)}</Select>
                  {!isAuthed && <FormHelperText>Your prescription must be approved by our pharmacist before payment goes through.</FormHelperText>}
                </FormControl>
              ) : (
                <Alert status="warning" borderRadius="xl" bg="gold.50" alignItems="start"><AlertIcon color="gold.600" mt={1} />
                  <Box fontSize="sm"><Text fontWeight={800}>{isAuthed ? 'No approved prescription yet' : 'Upload your prescription first'}</Text>
                    {prescriptionsEnabled && <><Text as={NextLink} href="/prescriptions" fontWeight={700} textDecoration="underline">Upload a prescription</Text> and come back once it’s approved. </>}
                    You can also send a photo to our pharmacist on <Text as="a" href={wa(msg)} target="_blank" rel="noopener noreferrer" fontWeight={700} textDecoration="underline">WhatsApp</Text>.</Box>
                </Alert>
              )}
            </Step>
          )}
        </VStack>

        <VStack align="stretch" spacing={4} position={{ lg: 'sticky' }} top={{ lg: '130px' }}>
          <OrderSummary totals={totals} couponCode={coupon?.code}>
            <Box mt={4}><CouponBox subtotal={subtotal} coupon={coupon} onApply={(c) => apply(c, subtotal)} onRemove={removeCoupon} /></Box>
            <VStack align="stretch" spacing={3} mt={5}>
              <Button variant="buy" size="lg" isLoading={busy} loadingText="Taking you to Paystack…" onClick={pay} leftIcon={<Icon name="lock" size={19} />}>Pay {money(totals.total)}</Button>
              <HStack justify="center" color="ink.500" fontSize="xs" spacing={1.5}><Icon name="shield" size={14} /><Text>Secured by Paystack · card, bank transfer, USSD</Text></HStack>
              <Button as="a" href={wa(msg)} target="_blank" rel="noopener noreferrer" variant="wa" leftIcon={<WhatsAppIcon size={20} />}>Prefer WhatsApp? Order there</Button>
            </VStack>
          </OrderSummary>
          <Button as={NextLink} href="/cart" variant="ghost" size="sm" leftIcon={<Icon name="left" size={16} />}>Back to cart</Button>
        </VStack>
      </Grid>
    </Page>
  );
}
