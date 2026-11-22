# Admin & pharmacist guide

Open **`/admin`** (e.g. `http://localhost:3000/admin`). Staff sign in with the accounts that live in the backend's `admins` collection. This is a separate login from shopper accounts, so a shopper can never open it.

## What each role sees

| Role | Sections |
|---|---|
| Super admin | everything, plus **Team** (create staff, change roles, deactivate) |
| Admin | dashboard, orders, products, inventory, categories & brands, coupons, banners, delivery, settings |
| Pharmacist | **Prescriptions**, orders (read), products (read) |
| Inventory manager | inventory, products (read) |
| Customer support | orders (read / update status) |
| Delivery manager | delivery, orders (read) |

The sidebar only lists what the signed-in role may use, and shows live counts (prescriptions waiting, orders to pack).

## Pharmacist workflow (`/admin/prescriptions`)

1. The **Pending** tab lists uploads oldest-first. It refreshes itself every 45 seconds.
2. Open one: zoom and rotate each page, page through multi-file uploads, open the original, read the customer's note.
3. Decide: **Approve**, **Clearer photo** (note required) or **Reject** (reason required). Quick-reply chips fill common reasons. "Mark as expired" is in the menu.
4. Registered customers are emailed automatically by the backend. For guests (phone number only) a **"Tell … on WhatsApp"** button appears with the message already written.
5. **Next prescription** jumps to the next one waiting.

A customer whose prescription is approved can then check out with it (registered customers pick it from their approved list).

## Order fulfilment (`/admin/orders`)

Filter chips: *Needs packing* (paid, not yet packed) → *Packed* → *On the way* → *Delivered*. Inside an order the **Next step** button walks it through: pack → assign rider (name + phone) → picked up → out for delivery → delivered. Each step is saved to the delivery timeline the customer sees on the tracking page. Staff can also call/WhatsApp the customer, open the invoice, or cancel.

## ⚠ Two small backend fixes needed for non-super-admin roles

I did not change your backend. While reading it I found that role permissions and route checks use different names, so **only `super_admin` currently has working access**:

- Roles are defined as `product:*`, `order:*`, `banner:*`, … (singular) but routes check `products:create`, `orders:read`, `banners:create`, … (plural). `"product:*"` never matches `"products:create"`, so the **admin** role is refused almost everywhere.
- The prescription routes require the exact role `pharmacist` (`require_role("pharmacist")`), so even a super admin can't review.

The admin UI already follows the intended design. To make the API match, apply both edits:

**1. `app/admins/rbac.py`** — replace `_matches` with:

```python
_ALIASES = {
    "products": "product", "orders": "order", "banners": "banner", "discounts": "discount",
    "brands": "brand", "categories": "category", "coupons": "coupon", "prescriptions": "prescription",
}

def _norm(p: str) -> str:
    resource, _, action = p.partition(":")
    return f"{_ALIASES.get(resource, resource)}:{action}"

def _matches(granted: str, required: str) -> bool:
    granted, required = _norm(granted), _norm(required)
    if granted == "*" or granted == required:
        return True
    if granted.endswith(":*"):
        return required.startswith(granted[:-1])
    return False
```

**2. `app/prescriptions/router.py`** — in `list_pharmacist_queue` and `review_prescription` (three places), replace `require_role("pharmacist")` with `require_permission("prescription:review")` (import it from `app.dependencies.auth`). `super_admin` then works too, and `pharmacist` keeps working.

## Good to know

- **Product photos:** the API has no upload endpoint, so the product form takes image links (for example Cloudinary URLs). Upload the image there first, then paste the link.
- **Delivery zones** can be added but not edited or deleted (the API only offers create).
- **Customers / reviews moderation:** the API has no list endpoints for these, so there are no admin screens for them.
- Settings changes can take up to five minutes to appear on the storefront (it caches them).
