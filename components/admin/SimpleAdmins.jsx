'use client';
import { Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react';
import CrudManager from './CrudManager';
import { Guard, PageHeader, Pill } from './ui';
import { useAdmin } from '@/context/AdminContext';
import { adminApi } from '@/lib/api';
import { fmtDate, money } from '@/lib/format';
import { slugify } from '@/lib/admin';
import { ROLE_LABELS } from '@/lib/rbac';

const yesNo = (v) => <Pill color={v ? 'green' : 'gray'}>{v ? 'Active' : 'Off'}</Pill>;

/* ---------- categories & brands ---------- */
export function CatalogueAdmin() {
  const { can } = useAdmin();
  return (
    <Guard perm="categories:update">
      <PageHeader title="Categories & brands" subtitle="How your catalogue is organised." />
      <Tabs variant="pill" isLazy>
        <TabList><Tab>Categories</Tab><Tab>Brands</Tab></TabList>
        <TabPanels mt={5}>
          <TabPanel>
            <CrudManager embedded noun="Category" subtitle="Shown on the home page and in filters."
              load={async () => (await adminApi.get('/categories', { active_only: false })).data || []}
              columns={[
                { label: 'Category', render: (r) => <Text fontWeight={700}>{r.emoji} {r.name}</Text> },
                { label: 'Slug', render: (r) => <Text color="ink.500" fontSize="sm">/{r.slug}</Text> },
                { label: 'Order', isNumeric: true, render: (r) => r.sort_order ?? 0 },
                { label: 'Status', render: (r) => yesNo(r.active) },
              ]}
              fields={[
                { name: 'name', label: 'Name', required: true }, { name: 'slug', label: 'Slug', help: 'Leave empty to generate from the name' },
                { name: 'emoji', label: 'Emoji', placeholder: '💊' }, { name: 'sort_order', label: 'Sort order', type: 'number', default: 0 },
                { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'active', label: 'Active', type: 'switch', default: true }, { name: 'featured', label: 'Featured', type: 'switch' },
              ]}
              transform={(p) => ({ ...p, slug: p.slug || slugify(p.name), sort_order: p.sort_order ?? 0 })}
              onCreate={(p) => adminApi.post('/categories', p)} onUpdate={(id, p) => adminApi.put(`/categories/${id}`, p)} onDelete={(id) => adminApi.del(`/categories/${id}`)}
              canCreate={can('categories:create')} canUpdate={can('categories:update')} canDelete={can('categories:delete')} />
          </TabPanel>
          <TabPanel>
            <CrudManager embedded noun="Brand" subtitle="Manufacturers and labels you stock."
              load={async () => (await adminApi.get('/brands', { active_only: false })).data || []}
              columns={[{ label: 'Brand', render: (r) => <Text fontWeight={700}>{r.name}</Text> }, { label: 'Slug', render: (r) => <Text color="ink.500" fontSize="sm">/{r.slug}</Text> }, { label: 'Status', render: (r) => yesNo(r.active) }]}
              fields={[
                { name: 'name', label: 'Name', required: true }, { name: 'slug', label: 'Slug', help: 'Leave empty to generate from the name' },
                { name: 'logo', label: 'Logo link', span: 2 }, { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'active', label: 'Active', type: 'switch', default: true }, { name: 'featured', label: 'Featured', type: 'switch' },
              ]}
              transform={(p) => ({ ...p, slug: p.slug || slugify(p.name), logo: p.logo || null })}
              onCreate={(p) => adminApi.post('/brands', p)} onUpdate={(id, p) => adminApi.put(`/brands/${id}`, p)} onDelete={(id) => adminApi.del(`/brands/${id}`)}
              canCreate={can('brands:create')} canUpdate={can('brands:update')} canDelete={can('brands:delete')} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Guard>
  );
}

/* ---------- coupons ---------- */
export function CouponsAdmin() {
  const { can } = useAdmin();
  return (
    <Guard perm="discounts:read">
      <CrudManager title="Coupons" subtitle="Codes customers enter at checkout. Percentage and fixed-amount coupons are applied at checkout." noun="Coupon"
        load={async () => (await adminApi.get('/discounts')).data || []}
        columns={[
          { label: 'Code', render: (r) => <Text fontWeight={800} letterSpacing="0.04em">{r.code || '—'}</Text> },
          { label: 'Name', render: (r) => r.name },
          { label: 'Discount', render: (r) => (r.type === 'percentage' ? `${r.value}%` : r.type === 'fixed_amount' ? money(r.value) : `${r.type} (${r.value})`) },
          { label: 'Used', isNumeric: true, render: (r) => `${r.used_count || 0}${r.maximum_uses ? ` / ${r.maximum_uses}` : ''}` },
          { label: 'Valid', render: (r) => <Text fontSize="sm" color="ink.600">{r.start_date || r.end_date ? `${r.start_date ? fmtDate(r.start_date) : 'Now'} – ${r.end_date ? fmtDate(r.end_date) : 'No end'}` : 'Always'}</Text> },
          { label: 'Status', render: (r) => yesNo(r.active) },
        ]}
        fields={[
          { name: 'name', label: 'Name', required: true, placeholder: 'Welcome offer' },
          { name: 'code', label: 'Code', placeholder: 'WELCOME10', help: 'Customers type this at checkout' },
          { name: 'type', label: 'Type', type: 'select', default: 'percentage', options: [{ value: 'percentage', label: 'Percentage off' }, { value: 'fixed_amount', label: 'Fixed amount off (₦)' }, { value: 'category', label: 'Category (not applied at checkout yet)' }, { value: 'product', label: 'Product (not applied at checkout yet)' }, { value: 'flash_sale', label: 'Flash sale (not applied at checkout yet)' }] },
          { name: 'value', label: 'Value', type: 'number', required: true, help: '10 = 10% or ₦10' },
          { name: 'minimum_purchase', label: 'Minimum order (₦)', type: 'number', default: 0 }, { name: 'maximum_uses', label: 'Max total uses', type: 'number', help: 'Empty = unlimited' },
          { name: 'start_date', label: 'Starts', type: 'date' }, { name: 'end_date', label: 'Ends', type: 'date' },
          { name: 'active', label: 'Active', type: 'switch', default: true },
        ]}
        transform={(p) => ({ ...p, code: p.code ? p.code.toUpperCase().replace(/\s+/g, '') : null, minimum_purchase: p.minimum_purchase ?? 0 })}
        onCreate={(p) => adminApi.post('/discounts', p)} onUpdate={(id, p) => adminApi.put(`/discounts/${id}`, p)} onDelete={(id) => adminApi.del(`/discounts/${id}`)}
        canCreate={can('discounts:create')} canUpdate={can('discounts:update')} canDelete={can('discounts:delete')} />
    </Guard>
  );
}

/* ---------- delivery zones (create only in the API) ---------- */
export function DeliveryAdmin() {
  const { can } = useAdmin();
  return (
    <Guard perm="delivery:read">
      <CrudManager title="Delivery zones" subtitle="Areas customers can choose at checkout, with an estimated delivery time. (The API supports adding zones; editing is not available yet.)" noun="Zone"
        load={async () => (await adminApi.get('/delivery/zones', { active_only: false })).data || []}
        columns={[
          { label: 'Zone', render: (r) => <Text fontWeight={700}>{r.name}</Text> }, { label: 'Code', render: (r) => r.code },
          { label: 'Base fee', isNumeric: true, render: (r) => money(r.base_fee) }, { label: 'Estimate', render: (r) => r.estimated_delivery_time }, { label: 'Status', render: (r) => yesNo(r.active) },
        ]}
        fields={[
          { name: 'name', label: 'Zone name', required: true, placeholder: 'Lagos Island' }, { name: 'code', label: 'Code', required: true, placeholder: 'LOS-ISL' },
          { name: 'base_fee', label: 'Base fee (₦)', type: 'number', required: true, default: 0 }, { name: 'estimated_delivery_time', label: 'Delivery estimate', required: true, placeholder: '1–2 hours' },
          { name: 'serviceable_zip_codes', label: 'Postcodes (optional)', type: 'lines', help: 'One per line' }, { name: 'active', label: 'Active', type: 'switch', default: true },
        ]}
        transform={(p) => ({ ...p, code: p.code.toUpperCase() })}
        onCreate={(p) => adminApi.post('/delivery/zones', p)} canCreate={can('delivery:update')} />
    </Guard>
  );
}

/* ---------- team (super admin) ---------- */
export function TeamAdmin() {
  return (
    <Guard role="super_admin">
      <CrudManager title="Team" subtitle="Staff accounts and what they can do." noun="Staff member"
        load={async () => (await adminApi.get('/admin/admins', { limit: 100 })).data || []}
        columns={[
          { label: 'Name', render: (r) => <><Text fontWeight={700}>{r.full_name}</Text><Text fontSize="sm" color="ink.500">{r.email}</Text></> },
          { label: 'Role', render: (r) => <Pill color={r.role === 'pharmacist' ? 'purple' : r.role === 'super_admin' ? 'orange' : 'blue'}>{ROLE_LABELS[r.role] || r.role}</Pill> },
          { label: 'Status', render: (r) => yesNo(r.is_active) },
        ]}
        fields={[
          { name: 'full_name', label: 'Full name', required: true }, { name: 'email', label: 'Email', type: 'email', required: true, createOnly: true },
          { name: 'password', label: 'Temporary password', type: 'password', required: true, createOnly: true, help: '8+ characters, a capital letter and a number' },
          { name: 'role', label: 'Role', type: 'select', required: true, default: 'pharmacist', options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) },
          { name: 'is_active', label: 'Account active', type: 'switch', default: true },
        ]}
        transform={(p, isEdit) => { if (!isEdit) { const { is_active, ...rest } = p; return rest; } return p; }}
        onCreate={(p) => adminApi.post('/admin/admins', p)} onUpdate={(id, p) => adminApi.patch(`/admin/admins/${id}`, p)} />
    </Guard>
  );
}
