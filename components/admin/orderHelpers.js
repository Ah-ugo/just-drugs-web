export const customerOf = (o) => o.guest_info?.name || o.delivery_address?.recipient_name || 'Customer';
export const phoneOf = (o) => o.guest_info?.phone || o.delivery_address?.phone || '';

export const ORDER_GROUPS = [
  { key: 'packing', label: 'Needs packing', test: (o) => o.status === 'preparing' && o.payment_status === 'paid' },
  { key: 'packed', label: 'Packed', test: (o) => o.status === 'packed' },
  { key: 'transit', label: 'On the way', test: (o) => ['assigned', 'picked_up', 'out_for_delivery'].includes(o.status) },
  { key: 'delivered', label: 'Delivered', test: (o) => o.status === 'delivered' },
  { key: 'unpaid', label: 'Awaiting payment', test: (o) => o.status === 'pending_payment' },
  { key: 'cancelled', label: 'Cancelled', test: (o) => o.status === 'cancelled' },
  { key: 'all', label: 'All', test: () => true },
];
