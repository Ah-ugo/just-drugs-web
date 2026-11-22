// Mirrors the backend's role model (app/admins/rbac.py) so the UI only offers what the API allows.
// The backend names roles' permissions in the singular ("order:*") but checks routes in the plural
// ("orders:read"); we normalise both so the UI follows the intended design (see ADMIN.md).
const SINGULAR = { products: 'product', orders: 'order', banners: 'banner', discounts: 'discount', brands: 'brand', categories: 'category', coupons: 'coupon', reviews: 'review', prescriptions: 'prescription' };
const norm = (p) => {
  const s = String(p);
  if (!s.includes(':')) return s; // the global wildcard "*"
  const [r, ...a] = s.split(':');
  return `${SINGULAR[r] || r}:${a.join(':')}`;
};

export const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  admin: ['product:*', 'inventory:*', 'order:*', 'banner:*', 'discount:*', 'coupon:*', 'review:moderate', 'analytics:read', 'category:*', 'brand:*', 'settings:*', 'delivery:*'],
  pharmacist: ['prescription:review', 'product:read', 'order:read'],
  inventory_manager: ['inventory:*', 'product:read', 'product:update_stock_fields'],
  customer_support: ['order:read', 'order:update_status', 'user:read', 'delivery:read', 'prescription:read'],
  delivery_manager: ['delivery:*', 'order:read', 'rider:*'],
};

export const ROLE_LABELS = {
  super_admin: 'Super admin', admin: 'Admin', pharmacist: 'Pharmacist', inventory_manager: 'Inventory manager',
  customer_support: 'Customer support', delivery_manager: 'Delivery manager',
};

export function hasPermission(role, extra, required) {
  if (role === 'super_admin') return true;
  const granted = [...(ROLE_PERMISSIONS[role] || []), ...(extra || [])].map(norm);
  const req = norm(required);
  return granted.some((g) => g === '*' || g === req || (g.endsWith(':*') && req.startsWith(g.slice(0, -1))));
}
