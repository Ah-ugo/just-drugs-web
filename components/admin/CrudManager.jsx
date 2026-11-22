'use client';
import { useState } from 'react';
import { Box, Button, Flex, HStack, IconButton, Input, Select, Switch, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import { AdminModal, ConfirmDialog, ErrorNote, Field, Loading, PageHeader, useLoad } from './ui';
import { useNotify } from '@/lib/hooks';
import { arrayToLines, fromISODate, linesToArray, toISODate, toNum } from '@/lib/admin';

const initialOf = (fields, item) => {
  const out = {};
  fields.forEach((f) => {
    const v = item ? item[f.name] : undefined;
    if (f.type === 'switch') out[f.name] = v ?? f.default ?? false;
    else if (f.type === 'lines') out[f.name] = arrayToLines(v);
    else if (f.type === 'date') out[f.name] = fromISODate(v);
    else out[f.name] = v ?? f.default ?? '';
  });
  return out;
};

const payloadOf = (fields, form, isEdit) => {
  const out = {};
  fields.forEach((f) => {
    if (isEdit && f.createOnly) return;
    const v = form[f.name];
    if (f.type === 'number') out[f.name] = toNum(v);
    else if (f.type === 'lines') out[f.name] = linesToArray(v);
    else if (f.type === 'date') out[f.name] = toISODate(v);
    else if (f.type === 'switch') out[f.name] = !!v;
    else out[f.name] = typeof v === 'string' ? v.trim() : v;
  });
  return out;
};

function FieldInput({ f, value, onChange }) {
  const common = { value: value ?? '', onChange: (e) => onChange(e.target.value) };
  if (f.type === 'textarea' || f.type === 'lines') return <Textarea rows={f.rows || 3} placeholder={f.placeholder} {...common} />;
  if (f.type === 'select') return <Select {...common}>{f.placeholderOption && <option value="">{f.placeholderOption}</option>}{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>;
  if (f.type === 'switch') return <Switch colorScheme="pine" size="lg" isChecked={!!value} onChange={(e) => onChange(e.target.checked)} />;
  return <Input type={f.type === 'number' ? 'number' : f.type || 'text'} step={f.type === 'number' ? 'any' : undefined} placeholder={f.placeholder} autoComplete="off" {...common} />;
}

/**
 * Config-driven list + create/edit/delete screen.
 * columns: [{ label, render(row), isNumeric }]  fields: [{ name, label, type, options, help, required, createOnly, span }]
 */
export default function CrudManager({ title, subtitle, noun, load, columns, fields, defaults, onCreate, onUpdate, onDelete, canCreate = true, canUpdate = true, canDelete = true, embedded, transform, emptyText }) {
  const notify = useNotify();
  const { loading, data, error, reload } = useLoad(load, []);
  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [fieldErrs, setFieldErrs] = useState({});
  const [confirm, setConfirm] = useState(null);

  const open = (row) => { setEditing(row || 'new'); setForm(initialOf(fields, row ? row : { ...defaults })); setErr(''); setFieldErrs({}); };
  const close = () => setEditing(null);
  const isEdit = editing && editing !== 'new';

  const save = async () => {
    const missing = {};
    fields.forEach((f) => { if (f.required && !(isEdit && f.createOnly) && (form[f.name] === '' || form[f.name] == null)) missing[f.name] = 'Required'; });
    setFieldErrs(missing);
    if (Object.keys(missing).length) return;
    setBusy(true); setErr('');
    try {
      let payload = payloadOf(fields, form, isEdit);
      if (transform) payload = transform(payload, isEdit, form);
      if (isEdit) await onUpdate(editing._id || editing.id, payload); else await onCreate(payload);
      notify.success(isEdit ? `${noun} updated` : `${noun} created`);
      close(); reload();
    } catch (e) { setErr(e.message); if (e.fieldErrors) setFieldErrs(e.fieldErrors); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try { await onDelete(confirm._id || confirm.id); notify.success(`${noun} deleted`); setConfirm(null); reload(); }
    catch (e) { notify.error(`Couldn’t delete ${noun.toLowerCase()}`, e.message); } finally { setBusy(false); }
  };

  const rows = data || [];
  const actions = canCreate && onCreate ? <Button variant="dark" leftIcon={<Icon name="add" size={18} />} onClick={() => open()}>New {noun.toLowerCase()}</Button> : null;

  return (
    <>
      {embedded
        ? <Flex justify="space-between" align="center" mb={4} gap={3}><Text color="ink.600">{subtitle}</Text>{actions}</Flex>
        : <PageHeader title={title} subtitle={subtitle} actions={actions} />}
      {loading ? <Loading /> : error ? <ErrorNote error={error} onRetry={reload} /> : (
        <Box bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" overflow="hidden">
          <TableContainer>
            <Table size="md">
              <Thead bg="ink.50"><Tr>{columns.map((c) => <Th key={c.label} isNumeric={c.isNumeric}>{c.label}</Th>)}{(onUpdate || onDelete) && <Th w="1%" />}</Tr></Thead>
              <Tbody>
                {rows.length === 0 && <Tr><Td colSpan={columns.length + 1} textAlign="center" color="ink.500" py={10}>{emptyText || `No ${noun.toLowerCase()}s yet.`}</Td></Tr>}
                {rows.map((row) => (
                  <Tr key={row._id || row.id} _hover={{ bg: 'ink.50' }}>
                    {columns.map((c) => <Td key={c.label} isNumeric={c.isNumeric} whiteSpace="normal">{c.render(row)}</Td>)}
                    {(onUpdate || onDelete) && (
                      <Td><HStack spacing={1} justify="flex-end">
                        {canUpdate && onUpdate && <IconButton aria-label={`Edit ${noun}`} icon={<Icon name="edit" size={18} />} size="sm" variant="ghost" onClick={() => open(row)} />}
                        {canDelete && onDelete && <IconButton aria-label={`Delete ${noun}`} icon={<Icon name="trash" size={18} />} size="sm" variant="ghost" color="coral.600" onClick={() => setConfirm(row)} />}
                      </HStack></Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <AdminModal isOpen={!!editing} onClose={close} title={isEdit ? `Edit ${noun.toLowerCase()}` : `New ${noun.toLowerCase()}`} onSubmit={save} busy={busy} error={err} size="xl">
        <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          {fields.filter((f) => !(isEdit && f.createOnly)).map((f) => (
            <Field key={f.name} label={f.label} error={fieldErrs[f.name]} help={f.help} gridColumn={{ md: f.span === 2 || f.type === 'textarea' || f.type === 'lines' ? '1 / -1' : undefined }} isRequired={f.required}>
              <FieldInput f={f} value={form[f.name]} onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))} />
            </Field>
          ))}
        </Box>
      </AdminModal>

      <ConfirmDialog isOpen={!!confirm} onClose={() => setConfirm(null)} onConfirm={remove} busy={busy} danger title={`Delete ${noun.toLowerCase()}?`}
        body={`“${confirm?.name || confirm?.code || confirm?.title || ''}” will be removed permanently.`} confirmLabel="Delete" />
    </>
  );
}
