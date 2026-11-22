'use client';
import { useState } from 'react';
import { Button, HStack, Input, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { AdminModal, Field } from './ui';
import { useAdmin } from '@/context/AdminContext';
import { adminApi } from '@/lib/api';
import { toISODate } from '@/lib/admin';
import { useNotify } from '@/lib/hooks';

/** Restock / adjust buttons + modals for one product. */
export default function StockActions({ productId, productName, onDone, size = 'sm' }) {
  const { can } = useAdmin();
  const notify = useNotify();
  const [mode, setMode] = useState(null); // 'restock' | 'adjust'
  const [f, setF] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (!can('inventory:update')) return null;

  const open = (m) => { setMode(m); setF(m === 'restock' ? { quantity: '', batch_number: '', expiry_date: '', supplier: '', reason: 'Restock' } : { quantity_change: '', reason: '' }); setErr(''); };
  const save = async () => {
    setErr('');
    try {
      setBusy(true);
      if (mode === 'restock') {
        const qty = parseInt(f.quantity, 10);
        if (!(qty > 0)) { setErr('Enter a quantity above zero.'); return; }
        await adminApi.post('/inventory/restock', { product_id: productId, quantity: qty, batch_number: f.batch_number || null, expiry_date: toISODate(f.expiry_date), supplier: f.supplier || null, reason: f.reason || 'Restock' });
      } else {
        const ch = parseInt(f.quantity_change, 10);
        if (!ch) { setErr('Enter how many to add (+) or remove (−).'); return; }
        if (!f.reason.trim()) { setErr('Give a reason, e.g. damaged, expired, count correction.'); return; }
        await adminApi.post('/inventory/adjust', { product_id: productId, quantity_change: ch, reason: f.reason.trim() });
      }
      notify.success(mode === 'restock' ? 'Stock added' : 'Stock adjusted');
      setMode(null); onDone?.();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  return (
    <>
      <HStack spacing={2}>
        <Button size={size} variant="dark" leftIcon={<Icon name="add" size={16} />} onClick={() => open('restock')}>Restock</Button>
        <Button size={size} variant="outline" onClick={() => open('adjust')}>Adjust</Button>
      </HStack>
      <AdminModal isOpen={!!mode} onClose={() => setMode(null)} title={`${mode === 'restock' ? 'Restock' : 'Adjust stock'}${productName ? ` · ${productName}` : ''}`} onSubmit={save} busy={busy} error={err} size="md" submitLabel={mode === 'restock' ? 'Add stock' : 'Apply'}>
        {mode === 'restock' ? (
          <VStack spacing={4} align="stretch">
            <Field label="Quantity received" isRequired><Input type="number" inputMode="numeric" min={1} value={f.quantity} onChange={set('quantity')} autoFocus /></Field>
            <Field label="Batch number"><Input value={f.batch_number} onChange={set('batch_number')} /></Field>
            <Field label="Expiry date"><Input type="date" value={f.expiry_date} onChange={set('expiry_date')} /></Field>
            <Field label="Supplier"><Input value={f.supplier} onChange={set('supplier')} /></Field>
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch">
            <Field label="Change (use − to remove)" isRequired help="e.g. 12 to add twelve, -3 to remove three"><Input type="number" inputMode="numeric" value={f.quantity_change} onChange={set('quantity_change')} autoFocus /></Field>
            <Field label="Reason" isRequired><Input value={f.reason} onChange={set('reason')} placeholder="Damaged, expired, stock-take correction…" /></Field>
          </VStack>
        )}
      </AdminModal>
    </>
  );
}
