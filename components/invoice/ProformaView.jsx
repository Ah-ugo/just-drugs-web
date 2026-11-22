'use client';
import NextLink from 'next/link';
import { Button } from '@chakra-ui/react';
import Invoice from './Invoice';
import { useTotals } from '@/components/checkout/OrderSummary';
import { EmptyState, Page } from '@/components/ui/Layout';
import { useCart } from '@/context/CartContext';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useCoupon } from '@/lib/coupon';
import { money } from '@/lib/format';
import { cartOrderMessage } from '@/lib/whatsapp';
import { siteOrigin } from '@/lib/config';

export default function ProformaView() {
  const { items, subtotal, requiresRx, ready } = useCart();
  const store = useStore();
  const { user } = useAuth();
  const { coupon } = useCoupon();
  const t = useTotals(subtotal, coupon);

  if (ready && !items.length) return <Page py={8}><EmptyState icon="receipt" title="Your cart is empty" text="Add items first, then come back for a proforma invoice."><Button as={NextLink} href="/shop" variant="buy">Shop medicines</Button></EmptyState></Page>;

  const now = new Date();
  const order = {
    order_number: `PRO-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(items.length).padStart(2, '0')}`,
    created_at: now.toISOString(),
    items: items.map((i) => ({ product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price, total_price: i.total_price })),
    subtotal: t.subtotal, discount_amount: t.discount, delivery_fee: t.delivery, tax_amount: t.tax, total_amount: t.total,
  };
  const customer = user ? { name: `${user.first_name} ${user.last_name}`, phone: user.phone, email: user.email } : undefined;
  const company = { company_name: store.storeName, company_address: store.address, company_phone: store.phone, company_email: store.email, currency_symbol: store.symbol, tax_name: store.taxName, tax_rate_percent: store.taxRate };
  const text = `${cartOrderMessage({ items, subtotal, requiresRx, origin: siteOrigin(), customer })}\n\nEstimated total incl. delivery & ${store.taxName}: ${money(t.total)}`;
  return <Invoice order={order} company={company} billTo={customer} proforma shareText={text} />;
}
