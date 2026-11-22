'use client';
import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Box, Button, Flex, Grid, Input, Switch, Text, VStack } from '@chakra-ui/react';
import { ErrorNote, Field, Guard, Loading, PageHeader, Panel, useLoad } from './ui';
import { useAdmin } from '@/context/AdminContext';
import { adminApi } from '@/lib/api';
import { useNotify } from '@/lib/hooks';

const SECTIONS = [['hero_carousel', 'Hero banners'], ['categories', 'Category tiles'], ['featured_products', 'Pharmacist picks'], ['popular_products', 'Most popular'], ['new_arrivals', 'New arrivals'], ['discounted_products', 'Deals'], ['prescription_cta', 'Prescription call-to-action'], ['banner_ads', 'Banner ads']];

const Toggle = ({ label, help, checked, onChange }) => (
  <Flex justify="space-between" align="center" gap={4} py={2}><Box><Text fontWeight={700}>{label}</Text>{help && <Text fontSize="sm" color="ink.500">{help}</Text>}</Box><Switch colorScheme="pine" size="lg" isChecked={!!checked} onChange={(e) => onChange(e.target.checked)} /></Flex>
);

export default function SettingsAdmin() {
  const { can } = useAdmin();
  const notify = useNotify();
  const { loading, data, error, reload } = useLoad(async () => (await adminApi.get('/settings')).data || {}, []);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF({ ...data, shop_sections_enabled: { ...Object.fromEntries(SECTIONS.map(([k]) => [k, true])), ...(data.shop_sections_enabled || {}) } }); }, [data]);
  const editable = can('settings:update');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const num = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await adminApi.put('/settings', {
        products_per_page: parseInt(f.products_per_page, 10) || 20, currency_symbol: f.currency_symbol || '₦', currency_code: f.currency_code || 'NGN',
        tax_rate_percent: Number(f.tax_rate_percent) || 0, default_delivery_fee: Number(f.default_delivery_fee) || 0, free_delivery_threshold: Number(f.free_delivery_threshold) || 0,
        maintenance_mode: !!f.maintenance_mode, enable_prescriptions: !!f.enable_prescriptions, shop_sections_enabled: f.shop_sections_enabled,
      });
      notify.success('Settings saved', 'The storefront refreshes these within a few minutes.'); reload();
    } catch (e2) { notify.error('Couldn’t save settings', e2.message); } finally { setBusy(false); }
  };

  return (
    <Guard perm="settings:read">
      <PageHeader title="Store settings" subtitle="Pricing rules and what the storefront shows." />
      {loading || !f ? (error ? <ErrorNote error={error} onRetry={reload} /> : <Loading />) : (
        <Box as="form" onSubmit={save} maxW="860px">
          {!editable && <Alert status="info" borderRadius="xl" mb={5}><AlertIcon />You can view these settings but not change them.</Alert>}
          <VStack align="stretch" spacing={6}>
            <Panel title="Delivery & tax">
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                <Field label="Delivery fee (₦)"><Input type="number" step="any" min={0} value={f.default_delivery_fee ?? ''} onChange={num('default_delivery_fee')} isDisabled={!editable} /></Field>
                <Field label="Free delivery from (₦)"><Input type="number" step="any" min={0} value={f.free_delivery_threshold ?? ''} onChange={num('free_delivery_threshold')} isDisabled={!editable} /></Field>
                <Field label="VAT / tax (%)"><Input type="number" step="any" min={0} value={f.tax_rate_percent ?? ''} onChange={num('tax_rate_percent')} isDisabled={!editable} /></Field>
                <Field label="Products per page"><Input type="number" min={4} max={100} value={f.products_per_page ?? 20} onChange={num('products_per_page')} isDisabled={!editable} /></Field>
              </Grid>
            </Panel>
            <Panel title="Store">
              <Toggle label="Accept prescription uploads" help="When off, customers are asked to send prescriptions on WhatsApp." checked={f.enable_prescriptions} onChange={editable ? set('enable_prescriptions') : () => {}} />
              <Toggle label="Maintenance mode" help="Marks the store as under maintenance in the API." checked={f.maintenance_mode} onChange={editable ? set('maintenance_mode') : () => {}} />
            </Panel>
            <Panel title="Home page sections">
              {SECTIONS.map(([k, label]) => <Toggle key={k} label={label} checked={f.shop_sections_enabled[k]} onChange={editable ? (v) => setF((s) => ({ ...s, shop_sections_enabled: { ...s.shop_sections_enabled, [k]: v } })) : () => {}} />)}
            </Panel>
            {editable && <Button type="submit" variant="buy" size="lg" alignSelf="flex-start" isLoading={busy}>Save settings</Button>}
          </VStack>
        </Box>
      )}
    </Guard>
  );
}
