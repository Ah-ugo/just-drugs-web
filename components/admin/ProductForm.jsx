'use client';
import NextLink from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertIcon, Box, Button, Checkbox, Grid, HStack, IconButton, Input, Radio, Select, Spinner, Text, Textarea, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import ProductImage from '@/components/ui/ProductImage';
import { ErrorNote, Field, Guard, Loading, PageHeader, Panel, useLoad } from './ui';
import StockActions from './StockActions';
import { useAdmin } from '@/context/AdminContext';
import { adminApi } from '@/lib/api';
import { arrayToLines, linesToArray, slugify, toNum, urlId } from '@/lib/admin';
import { useNotify } from '@/lib/hooks';

const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Cream', 'Ointment', 'Gel', 'Drops', 'Spray', 'Inhaler', 'Sachet', 'Lozenge', 'Suppository', 'Other'];
const FLAGS = [['requires_prescription', 'Requires prescription'], ['active', 'Active'], ['published', 'Published'], ['featured', 'Featured'], ['popular', 'Popular'], ['best_seller', 'Best seller'], ['new_arrival', 'New arrival'], ['recommended', 'Recommended']];

const blank = {
  name: '', slug: '', sku: '', barcode: '', category_id: '', brand_id: '', generic_name: '', manufacturer: '', strength: '', dosage_form: '', price: '', discount_price: '', cost_price: '',
  description: '', uses: '', warnings: '', side_effects: '', ingredients: '', images: [{ url: '', is_primary: true }],
  requires_prescription: false, active: true, published: true, featured: false, popular: false, best_seller: false, new_arrival: false, recommended: false,
  initial_stock: '0', reorder_level: '10', supplier: '',
};

const fromProduct = (p) => ({
  ...blank, ...Object.fromEntries(Object.keys(blank).map((k) => [k, p[k] ?? blank[k]])),
  price: String(p.price ?? ''), discount_price: p.discount_price ? String(p.discount_price) : '', cost_price: p.cost_price ? String(p.cost_price) : '',
  uses: arrayToLines(p.uses), warnings: arrayToLines(p.warnings), side_effects: arrayToLines(p.side_effects), ingredients: arrayToLines(p.ingredients),
  images: p.images?.length ? p.images.map((i) => ({ url: i.url, is_primary: !!i.is_primary, public_id: i.public_id })) : [{ url: '', is_primary: true }],
  brand_id: p.brand_id || '', category_id: p.category_id || '', strength: p.strength || '', dosage_form: p.dosage_form || '',
});

export default function ProductForm({ id }) {
  const router = useRouter();
  const notify = useNotify();
  const { can } = useAdmin();
  const isEdit = !!id;
  const [f, setF] = useState(blank);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errs, setErrs] = useState({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const lookups = useLoad(async () => {
    const [c, b] = await Promise.all([adminApi.get('/categories', { active_only: false }), adminApi.get('/brands', { active_only: false })]);
    return { cats: c.data || [], brands: b.data || [] };
  }, []);
  const product = useLoad(async () => (isEdit ? (await adminApi.get(`/products/${id}`)).data : null), [id]);
  const inv = useLoad(async () => (isEdit && can('inventory:read') ? (await adminApi.get(`/inventory/${id}`)).data : null), [id]);

  useEffect(() => { if (product.data) setF(fromProduct(product.data)); }, [product.data]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((s) => {
      const next = { ...s, [k]: v };
      if (k === 'name' && !slugTouched) next.slug = slugify(v);
      return next;
    });
    setErrs((x) => ({ ...x, [k]: undefined }));
  };
  const setImg = (i, patch) => setF((s) => ({ ...s, images: s.images.map((im, k) => (k === i ? { ...im, ...patch } : patch.is_primary ? { ...im, is_primary: false } : im)) }));

  const uploadFiles = async (files) => {
    if (!files || !files.length) return;
    setUploading(true);
    let successCount = 0;
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          notify.error('Invalid file', `${file.name} is not an image`);
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('is_primary', f.images.every((im) => !im.url) ? 'true' : 'false');
        const res = await adminApi.upload('/products/upload-image', formData);
        const data = res?.data || res;
        if (data?.url) {
          successCount++;
          setF((s) => {
            const emptyIdx = s.images.findIndex((im) => !im.url);
            if (emptyIdx >= 0) {
              return {
                ...s,
                images: s.images.map((im, idx) =>
                  idx === emptyIdx ? { ...im, url: data.url, public_id: data.public_id } : im
                ),
              };
            }
            return {
              ...s,
              images: [
                ...s.images,
                { url: data.url, public_id: data.public_id, is_primary: s.images.length === 0 },
              ],
            };
          });
        }
      }
      if (successCount > 0) {
        notify.success('Uploaded to Cloudinary', `${successCount} photo${successCount > 1 ? 's' : ''} added`);
      }
    } catch (e) {
      notify.error('Upload failed', e.message || 'Could not upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Enter the product name.';
    if (!f.sku.trim()) e.sku = 'SKU is required.';
    if (!f.category_id) e.category_id = 'Choose a category.';
    if (!(toNum(f.price) > 0)) e.price = 'Enter a price above zero.';
    if (f.discount_price && !(toNum(f.discount_price) > 0 && toNum(f.discount_price) < toNum(f.price))) e.discount_price = 'Sale price must be lower than the price.';
    if (f.description.trim().length < 10) e.description = 'Add a short description (10+ characters).';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const save = async (ev) => {
    ev.preventDefault(); setFormErr('');
    if (!validate()) { setFormErr('Please fix the highlighted fields.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const cat = lookups.data?.cats.find((c) => c._id === f.category_id);
    const brand = lookups.data?.brands.find((b) => b._id === f.brand_id);
    let images = f.images.filter((i) => i.url.trim()).map((i) => ({ url: i.url.trim(), public_id: i.public_id || urlId(i.url.trim()), is_primary: !!i.is_primary }));
    if (images.length && !images.some((i) => i.is_primary)) images[0].is_primary = true;
    const body = {
      name: f.name.trim(), slug: f.slug.trim() || slugify(f.name), sku: f.sku.trim(), barcode: f.barcode.trim() || null,
      category_id: f.category_id, brand_id: f.brand_id || null, generic_name: f.generic_name.trim() || null, manufacturer: f.manufacturer.trim() || null,
      strength: f.strength.trim() || null, dosage_form: f.dosage_form || null, description: f.description.trim(),
      uses: linesToArray(f.uses), warnings: linesToArray(f.warnings), side_effects: linesToArray(f.side_effects), ingredients: linesToArray(f.ingredients),
      price: toNum(f.price), cost_price: toNum(f.cost_price), images,
      // The API ignores nulls on update, so a cleared sale price is saved as 0 (= no discount).
      discount_price: f.discount_price ? toNum(f.discount_price) : (isEdit ? 0 : null),
      ...Object.fromEntries(FLAGS.map(([k]) => [k, !!f[k]])),
    };
    setBusy(true);
    try {
      if (isEdit) { await adminApi.put(`/products/${id}`, body); notify.success('Product saved'); product.reload(); }
      else {
        await adminApi.post('/products', { ...body, category_name: cat?.name || null, brand_name: brand?.name || null, initial_stock: parseInt(f.initial_stock, 10) || 0, reorder_level: parseInt(f.reorder_level, 10) || 10, supplier: f.supplier.trim() || null });
        notify.success('Product created'); router.push('/admin/products');
      }
    } catch (e) {
      setFormErr(e.message); setErrs((x) => ({ ...x, ...(e.fieldErrors || {}) })); window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setBusy(false); }
  };

  const ready = lookups.data && (!isEdit || product.data);
  const stock = inv.data;

  return (
    <Guard perm={isEdit ? 'products:update' : 'products:create'}>
      <Button as={NextLink} href="/admin/products" variant="ghost" size="sm" mb={3} leftIcon={<Icon name="left" size={16} />}>All products</Button>
      <PageHeader title={isEdit ? 'Edit product' : 'New product'} subtitle={isEdit ? f.name : 'Add a medicine to your catalogue.'} />
      {lookups.error || product.error ? <ErrorNote error={lookups.error || product.error} onRetry={() => { lookups.reload(); product.reload(); }} /> : !ready ? <Loading /> : (
        <Box as="form" onSubmit={save} noValidate>
          {formErr && <Alert status="error" borderRadius="xl" mb={5} role="alert"><AlertIcon />{formErr}</Alert>}
          <Grid templateColumns={{ base: '1fr', xl: '1.6fr 1fr' }} gap={6} alignItems="start">
            <VStack align="stretch" spacing={6}>
              <Panel title="Basics">
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                  <Field label="Product name" error={errs.name} gridColumn={{ md: '1 / -1' }} isRequired><Input value={f.name} onChange={set('name')} placeholder="e.g. Emzor Paracetamol 500mg" /></Field>
                  <Field label="Slug (web address)" help={`/drugs/${f.slug || '…'}`}><Input value={f.slug} onChange={(e) => { setSlugTouched(true); set('slug')(e); }} /></Field>
                  <Field label="SKU" error={errs.sku} isRequired><Input value={f.sku} onChange={set('sku')} /></Field>
                  <Field label="Category" error={errs.category_id} isRequired><Select placeholder="Select category" value={f.category_id} onChange={set('category_id')}>{lookups.data.cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</Select></Field>
                  <Field label="Brand"><Select placeholder="No brand" value={f.brand_id} onChange={set('brand_id')}>{lookups.data.brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</Select></Field>
                  <Field label="Generic name"><Input value={f.generic_name} onChange={set('generic_name')} /></Field>
                  <Field label="Manufacturer"><Input value={f.manufacturer} onChange={set('manufacturer')} /></Field>
                  <Field label="Strength"><Input value={f.strength} onChange={set('strength')} placeholder="500mg" /></Field>
                  <Field label="Form"><Select placeholder="Select form" value={f.dosage_form} onChange={set('dosage_form')}>{FORMS.map((x) => <option key={x}>{x}</option>)}</Select></Field>
                  <Field label="Barcode"><Input value={f.barcode} onChange={set('barcode')} /></Field>
                </Grid>
              </Panel>

              <Panel title="Pricing">
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                  <Field label="Price (₦)" error={errs.price} isRequired><Input type="number" inputMode="decimal" step="any" min={0} value={f.price} onChange={set('price')} /></Field>
                  <Field label="Sale price (₦)" error={errs.discount_price} help="Leave empty for no discount"><Input type="number" inputMode="decimal" step="any" min={0} value={f.discount_price} onChange={set('discount_price')} /></Field>
                  <Field label="Cost price (₦)" help="Only you see this"><Input type="number" inputMode="decimal" step="any" min={0} value={f.cost_price} onChange={set('cost_price')} /></Field>
                </Grid>
              </Panel>

              <Panel title="Description & medical info">
                <VStack align="stretch" spacing={4}>
                  <Field label="Description" error={errs.description} isRequired><Textarea rows={4} value={f.description} onChange={set('description')} /></Field>
                  <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                    <Field label="Uses" help="One per line"><Textarea rows={4} value={f.uses} onChange={set('uses')} /></Field>
                    <Field label="Warnings" help="One per line"><Textarea rows={4} value={f.warnings} onChange={set('warnings')} /></Field>
                    <Field label="Side effects" help="One per line"><Textarea rows={4} value={f.side_effects} onChange={set('side_effects')} /></Field>
                    <Field label="Ingredients" help="One per line"><Textarea rows={4} value={f.ingredients} onChange={set('ingredients')} /></Field>
                  </Grid>
                </VStack>
              </Panel>

              <Panel
                title="Photos"
                actions={
                  <HStack spacing={2}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => uploadFiles(Array.from(e.target.files || []))}
                    />
                    <Button
                      size="sm"
                      variant="solid"
                      colorScheme="pine"
                      leftIcon={uploading ? <Spinner size="xs" /> : <Icon name="upload" size={16} />}
                      isLoading={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload to Cloudinary
                    </Button>
                    <Button
                      size="sm"
                      variant="soft"
                      leftIcon={<Icon name="add" size={16} />}
                      onClick={() =>
                        setF((s) => ({
                          ...s,
                          images: [...s.images, { url: '', is_primary: false }],
                        }))
                      }
                    >
                      Add link
                    </Button>
                  </HStack>
                }
              >
                <Text fontSize="sm" color="ink.600" mb={3}>
                  Upload photos directly to Cloudinary or paste image links. The first / “main” photo is used on cards and share previews.
                </Text>

                <Box
                  p={4}
                  mb={4}
                  border="2px dashed"
                  borderColor={uploading ? 'pine.500' : 'ink.200'}
                  borderRadius="xl"
                  bg="pine.50"
                  textAlign="center"
                  cursor="pointer"
                  transition="border-color .2s, background-color .2s"
                  _hover={{ borderColor: 'pine.500', bg: 'pine.100' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <HStack justify="center" spacing={2} color="pine.800" fontWeight={700} fontSize="sm">
                    {uploading ? <Spinner size="sm" color="pine.600" /> : <Icon name="upload" size={20} color="#1B7F5A" />}
                    <Text>{uploading ? 'Uploading to Cloudinary...' : 'Click to select and upload photos from your device'}</Text>
                  </HStack>
                  <Text fontSize="xs" color="ink.500" mt={1}>Supports PNG, JPG, WEBP, GIF. Automatic Cloudinary optimization.</Text>
                </Box>

                <VStack align="stretch" spacing={3}>
                  {f.images.map((im, i) => (
                    <HStack key={i} spacing={3} align="center">
                      <ProductImage product={{ name: f.name }} src={im.url || null} width={120} w="52px" flexShrink={0} rounded="lg" />
                      <Input value={im.url} onChange={(e) => setImg(i, { url: e.target.value })} placeholder="https://res.cloudinary.com/…" aria-label={`Photo ${i + 1} link`} />
                      <Radio isChecked={!!im.is_primary} onChange={() => setImg(i, { is_primary: true })} colorScheme="pine" aria-label="Main photo" flexShrink={0}><Text fontSize="xs">Main</Text></Radio>
                      <IconButton aria-label="Remove photo" icon={<Icon name="trash" size={18} />} size="sm" variant="ghost" color="coral.600" isDisabled={f.images.length === 1 && !im.url}
                        onClick={() => setF((s) => ({ ...s, images: s.images.length > 1 ? s.images.filter((_, k) => k !== i) : [{ url: '', is_primary: true }] }))} />
                    </HStack>
                  ))}
                </VStack>
              </Panel>
            </VStack>

            <VStack align="stretch" spacing={6} position={{ xl: 'sticky' }} top={{ xl: '24px' }}>
              <Panel title="Visibility">
                <VStack align="stretch" spacing={2.5}>
                  {FLAGS.map(([k, label]) => <Checkbox key={k} colorScheme="pine" isChecked={!!f[k]} onChange={set(k)}>{label}</Checkbox>)}
                </VStack>
              </Panel>

              {!isEdit ? (
                <Panel title="Opening stock">
                  <VStack align="stretch" spacing={4}>
                    <Field label="Units in stock"><Input type="number" inputMode="numeric" min={0} value={f.initial_stock} onChange={set('initial_stock')} /></Field>
                    <Field label="Reorder level" help="You’ll be alerted when stock falls to this"><Input type="number" inputMode="numeric" min={0} value={f.reorder_level} onChange={set('reorder_level')} /></Field>
                    <Field label="Supplier"><Input value={f.supplier} onChange={set('supplier')} /></Field>
                  </VStack>
                </Panel>
              ) : stock && (
                <Panel title="Stock">
                  <Grid templateColumns="1fr 1fr 1fr" gap={3} mb={4} textAlign="center">
                    {[['On hand', stock.current_stock], ['Reserved', stock.reserved_stock], ['Available', Math.max(0, (stock.current_stock || 0) - (stock.reserved_stock || 0))]].map(([l, v]) => (
                      <Box key={l} bg="ink.50" borderRadius="xl" py={3}><Text fontFamily="heading" fontWeight={800} fontSize="2xl">{v ?? 0}</Text><Text fontSize="xs" color="ink.500">{l}</Text></Box>
                    ))}
                  </Grid>
                  <StockActions productId={id} productName={f.name} onDone={inv.reload} />
                </Panel>
              )}

              <Button type="submit" variant="buy" size="lg" isLoading={busy}>{isEdit ? 'Save changes' : 'Create product'}</Button>
            </VStack>
          </Grid>
        </Box>
      )}
    </Guard>
  );
}
