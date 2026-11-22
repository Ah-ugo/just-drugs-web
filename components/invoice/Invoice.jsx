'use client';
import { useState } from 'react';
import { Badge, Box, Button, Flex, Grid, Heading, HStack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import WhatsAppIcon from '@/components/ui/WhatsAppIcon';
import { LogoMark } from '@/components/ui/Logo';
import { Page } from '@/components/ui/Layout';
import { apiUrl } from '@/lib/api';
import { fmtDate, money } from '@/lib/format';
import { useStore } from '@/context/StoreContext';
import { useNotify } from '@/lib/hooks';
import { invoiceShareMessage } from '@/lib/whatsapp';
import { siteOrigin } from '@/lib/config';

const Meta = ({ label, children }) => (
  <Box><Text fontSize="xs" color="ink.500" fontWeight={700}>{label}</Text><Text fontWeight={600}>{children}</Text></Box>
);

/** Printable invoice. `proforma` = quote built from the cart (not a receipt). */
export default function Invoice({ order, company = {}, billTo, proforma = false, shareText }) {
  const { wa } = useStore();
  const notify = useNotify();
  const [copied, setCopied] = useState(false);
  const sym = company.currency_symbol || '₦';
  const m = (v) => money(v, sym);
  const paid = order.payment_status === 'paid';
  const addr = order.delivery_address || {};
  const bill = billTo || order.guest_info || { name: addr.recipient_name, phone: addr.phone };
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const name = company.company_name || 'Just Drugs';

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); notify.success('Invoice link copied'); setTimeout(() => setCopied(false), 2000); } catch { notify.error('Couldn’t copy the link'); }
  };

  return (
    <Page py={{ base: 5, md: 10 }} maxW="920px">
      <Flex className="no-print" gap={2.5} mb={5} flexWrap="wrap">
        <Button variant="dark" onClick={() => window.print()} leftIcon={<Icon name="print" size={18} />}>Print / Save as PDF</Button>
        {!proforma && <Button as="a" href={apiUrl(`/orders/${order.order_number}/invoice.pdf`)} download variant="outline" leftIcon={<Icon name="download" size={18} />}>Download PDF</Button>}
        <Button as="a" target="_blank" rel="noopener noreferrer" variant="wa"
          href={wa(shareText || invoiceShareMessage({ orderNumber: order.order_number, total: order.total_amount, url: `${siteOrigin()}/orders/${order.order_number}/invoice` }))}
          leftIcon={<WhatsAppIcon size={20} />}>Share on WhatsApp</Button>
        {!proforma && <Button variant="ghost" onClick={copy} leftIcon={<Icon name={copied ? 'check' : 'copy'} size={18} />}>{copied ? 'Copied' : 'Copy link'}</Button>}
      </Flex>

      <Box className="print-area" bg="white" border="1px solid" borderColor="ink.100" borderRadius="2xl" p={{ base: 5, md: 10 }} boxShadow="soft">
        <Flex justify="space-between" gap={6} direction={{ base: 'column', sm: 'row' }} pb={6} borderBottom="2px solid" borderColor="pine.800">
          <HStack align="start" spacing={3}>
            <LogoMark size={44} />
            <Box>
              <Heading as="p" fontSize="2xl">{name}</Heading>
              <VStack align="start" spacing={0} fontSize="sm" color="ink.600" mt={1}>
                {company.company_address && <Text>{company.company_address}</Text>}
                {company.company_phone && <Text>{company.company_phone}</Text>}
                {company.company_email && <Text>{company.company_email}</Text>}
              </VStack>
            </Box>
          </HStack>
          <Box textAlign={{ sm: 'right' }}>
            <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} color="pine.800">{proforma ? 'PROFORMA INVOICE' : 'INVOICE'}</Heading>
            <Text fontWeight={700} mt={1}>{order.order_number}</Text>
            <Text color="ink.600" fontSize="sm">{fmtDate(order.created_at || new Date())}</Text>
            {!proforma && <Badge mt={2} colorScheme={paid ? 'green' : 'orange'} variant="solid" px={3}>{paid ? 'PAID' : String(order.payment_status || 'pending').toUpperCase()}</Badge>}
          </Box>
        </Flex>

        <Grid templateColumns={{ base: '1fr', sm: '1fr 1fr' }} gap={6} py={6}>
          <Box>
            <Text fontSize="xs" color="ink.500" fontWeight={700} mb={1}>BILLED TO</Text>
            <Text fontWeight={700}>{bill?.name || '—'}</Text>
            {bill?.email && <Text fontSize="sm" color="ink.600">{bill.email}</Text>}
            {bill?.phone && <Text fontSize="sm" color="ink.600">{bill.phone}</Text>}
          </Box>
          {addr.street_address && (
            <Box>
              <Text fontSize="xs" color="ink.500" fontWeight={700} mb={1}>DELIVER TO</Text>
              <Text fontWeight={700}>{addr.recipient_name}</Text>
              <Text fontSize="sm" color="ink.600">{addr.street_address}, {addr.city}, {addr.state}</Text>
              {addr.phone && <Text fontSize="sm" color="ink.600">{addr.phone}</Text>}
            </Box>
          )}
        </Grid>

        <TableContainer>
          <Table size="md" variant="simple">
            <Thead><Tr><Th pl={0}>Item</Th><Th isNumeric>Qty</Th><Th isNumeric>Unit price</Th><Th isNumeric pr={0}>Amount</Th></Tr></Thead>
            <Tbody>
              {(order.items || []).map((it, i) => (
                <Tr key={i}>
                  <Td pl={0} whiteSpace="normal"><Text fontWeight={600}>{it.product_name}</Text>{it.sku && <Text fontSize="xs" color="ink.500">{it.sku}</Text>}</Td>
                  <Td isNumeric>{it.quantity}</Td><Td isNumeric>{m(it.unit_price)}</Td><Td isNumeric pr={0} fontWeight={700}>{m(it.total_price)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Flex justify="flex-end" mt={6}>
          <VStack align="stretch" spacing={2} w={{ base: '100%', sm: '320px' }}>
            <HStack justify="space-between"><Text color="ink.600">Subtotal</Text><Text>{m(order.subtotal)}</Text></HStack>
            {order.discount_amount > 0 && <HStack justify="space-between" color="pine.600"><Text>Discount</Text><Text>−{m(order.discount_amount)}</Text></HStack>}
            <HStack justify="space-between"><Text color="ink.600">Delivery</Text><Text>{order.delivery_fee > 0 ? m(order.delivery_fee) : 'Free'}</Text></HStack>
            <HStack justify="space-between"><Text color="ink.600">{company.tax_name || 'VAT'} ({company.tax_rate_percent ?? 7.5}%)</Text><Text>{m(order.tax_amount)}</Text></HStack>
            <HStack justify="space-between" pt={3} borderTop="2px solid" borderColor="pine.800"><Text fontFamily="heading" fontWeight={800} fontSize="xl">{proforma ? 'Estimated total' : paid ? 'Total paid' : 'Total due'}</Text><Text fontFamily="heading" fontWeight={800} fontSize="xl">{m(order.total_amount)}</Text></HStack>
          </VStack>
        </Flex>

        <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={4} mt={8} pt={6} borderTop="1px solid" borderColor="ink.100">
          {!proforma && <Meta label="Payment status">{paid ? 'Paid via Paystack' : order.payment_status}</Meta>}
          {order.payment_reference && <Meta label="Payment reference">{order.payment_reference}</Meta>}
          {!proforma && <Meta label="Order status">{String(order.status || '').replace(/_/g, ' ')}</Meta>}
        </Grid>
        <Text mt={8} fontSize="sm" color="ink.500">
          {proforma ? 'This is a quotation, not a receipt. Prices and stock are confirmed when you place the order.' : `Thank you for shopping with ${name}. This is a computer-generated invoice and needs no signature.`}
        </Text>
      </Box>
    </Page>
  );
}
