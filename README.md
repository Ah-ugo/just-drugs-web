# Just Drugs — Web (Next.js)

Storefront for the Just Drugs FastAPI backend, built for Nigerian customers: ₦ pricing, Nigerian phone/state handling, WhatsApp ordering, Paystack checkout, prescription upload and printable invoices.

**Stack:** Next.js 14 (App Router, JavaScript) · Chakra UI v2 · iconsax-react · no other UI dependencies.

## Run it

```bash
cp .env.example .env.local      # then edit (see below)
npm install
npm run dev                     # http://localhost:3000
```

Start the backend first (`uvicorn` on port 8000). The browser never calls the API directly: Next proxies `/backend/*` to `API_URL`, so **no CORS setup is needed**.

### Environment

| Variable | Purpose |
|---|---|
| `API_URL` | Backend URL incl. `/api/v1` (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of this site (share links, SEO, sitemap). Falls back to `RENDER_EXTERNAL_URL` on Render |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Your pharmacy WhatsApp, e.g. `2348031234567` or `08031234567`. **Set this** — it powers every WhatsApp button |
| `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_SUPPORT_PHONE`, `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional branding / footer contact |

### Backend settings that must match

In the backend `.env`:

- `FRONTEND_URL` = this site's public URL. Paystack redirects to `{FRONTEND_URL}/checkout/verify`, and emails link to `/verify-email?token=` and `/reset-password?token=` — all three routes exist here.
- `PAYSTACK_SECRET_KEY` must be set in production. When empty the backend runs a **mock payment mode** that treats orders as paid.

## What's included

- **Shareable drug pages** at `/drugs/[slug]`: per-product title/description, canonical URL, Open Graph + a generated share image (name, price, photo), JSON-LD `Product` schema, and a Share menu (WhatsApp, Telegram, Facebook, email, copy link, native share).
- **SEO:** `sitemap.xml` (all products + categories), `robots.txt`, web manifest, noindex on cart/checkout/account/search pages.
- **WhatsApp ordering:** per-product, whole-cart, restock enquiries, prescription sending, invoice sharing, floating chat button, sticky mobile buy bar.
- **Invoicing:** printable invoice per order (`/orders/[n]/invoice`) with Print/Save-as-PDF, backend PDF download, WhatsApp share; a **proforma invoice** from the cart (`/invoice/proforma`).
- **Catalogue:** server-rendered shop/category pages, filters (category, brand, price, no-prescription), sorting, pagination, live search suggestions, home page driven by `/homepage` (banners, categories, rails).
- **Cart & checkout:** guest or account cart (merged on login), free-delivery progress, coupons, saved addresses, all 37 states, Paystack redirect + verification screen, same totals maths as the backend.
- **Prescriptions:** camera/gallery/PDF upload, status tracking for signed-in users, auto-added matched products.
- **Orders:** order details, delivery timeline, tracking by order number + phone, "buy again".
- **Account:** profile, addresses, password, referral link (shared on WhatsApp), wishlist.
- **Admin & pharmacist area at `/admin`:** dashboard, prescription approval workspace, order fulfilment with rider assignment, products (create/edit/stock), inventory alerts, categories & brands, coupons, banners, delivery zones, settings and team. Role-aware and separate from shopper login. **Read `ADMIN.md`** (it includes two small backend fixes needed for non-super-admin roles).
- **Performance for mobile data:** Cloudinary/Unsplash images are requested at the displayed size in modern formats; lazy loading; swipeable rails; bottom navigation on phones.

## Notes

- **Product photos:** products without images (the seed data has none) show illustrated artwork chosen from the product name/form. Upload real photos in the backend and they replace it automatically.
- **Icons:** `scripts/gen-icons.mjs` runs before `dev`/`build`, checks the installed `iconsax-react` for each icon in `lib/icon-map.json`, and generates `components/ui/icons.generated.js` with only the ones that exist (alternates are tried; missing ones show a neutral dot instead of breaking the build). Change an icon by editing the map.
- **Images from other hosts** work (plain `<img>`); only Cloudinary and Unsplash URLs get size optimisation.
- Legal pages (Terms, Privacy) are not included, add yours before launch.

## Deploy (Render)

`render.yaml` is included. Set `API_URL` and `NEXT_PUBLIC_WHATSAPP_NUMBER`, then deploy.
