import { money } from './format';
import { waDigitsOf, STORE_NAME } from './config';
import { priceInfo, productUrl } from './product';

export function waLink(text = '', number = '') {
  const n = waDigitsOf(number || WHATSAPP_NUMBER || '09028022359');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  // Without a configured number, wa.me/?text= lets the customer pick the chat.
  return n ? `https://wa.me/${n}${q}` : `https://wa.me/${q}`;
}

export function productOrderMessage({ product, qty = 1, origin, customer }) {
  const { current } = priceInfo(product);
  const lines = [
    `Hello ${STORE_NAME} 👋 I'd like to order:`,
    '',
    `*${product.name}* × ${qty} — ${money(current * qty)}`,
    `${origin}${productUrl(product.slug)}`,
  ];
  if (product.requires_prescription) lines.push('', '⚠️ This needs a prescription — I will send a photo here.');
  lines.push('', ...customerLines(customer), 'Please confirm availability and delivery.');
  return lines.join('\n');
}

export function cartOrderMessage({ items, subtotal, origin, customer, requiresRx }) {
  const rows = items.map((it, i) =>
    `${i + 1}. *${it.product_name}* × ${it.quantity} — ${money(it.total_price)}\n   ${origin}${productUrl(it.slug)}`);
  const lines = [`Hello ${STORE_NAME} 👋 I'd like to order:`, '', ...rows, '', `*Subtotal: ${money(subtotal)}*`];
  if (requiresRx) lines.push('', '⚠️ Some items need a prescription — I will send a photo here.');
  lines.push('', ...customerLines(customer), 'Please confirm availability, delivery fee and how to pay.');
  return lines.join('\n');
}

function customerLines(c) {
  const out = [];
  if (c?.name) out.push(`Name: ${c.name}`);
  if (c?.phone) out.push(`Phone: ${c.phone}`);
  out.push('Delivery address: ');
  return out;
}

export function shareProductMessage({ product, url }) {
  const { current } = priceInfo(product);
  return `${product.name} — ${money(current)} on ${STORE_NAME}\n${url}`;
}

export function invoiceShareMessage({ orderNumber, total, url }) {
  return `Invoice for order ${orderNumber} (${money(total)}) from ${STORE_NAME}:\n${url}`;
}
