---
name: hydrogen-tanstack-start
description: >-
  Integrate Shopify Hydrogen (the framework-agnostic @shopify/hydrogen toolkit:
  Storefront API client, cart server handlers, and React cart/product bindings)
  into a TanStack Start app. Use when wiring Hydrogen into TanStack Start,
  building a Shopify storefront on TanStack Start/Nitro/Vite, or debugging
  Hydrogen cart/product/Standard-Actions issues in that stack. This is Hydrogen
  only, NOT Oxygen hosting and NOT the Remix-based Hydrogen framework.
---

# Hydrogen on TanStack Start

Wire Shopify's `@shopify/hydrogen` toolkit into a TanStack Start app. Hydrogen here is a **framework-agnostic toolkit**, not a framework:

- **Hydrogen** (this skill) = `@shopify/hydrogen`: Storefront API client, cart server handlers, request handlers, and React bindings from `@shopify/hydrogen/react`.
- **NOT Oxygen** = Shopify's edge hosting runtime. TanStack Start runs on Nitro/Vite instead; deploy anywhere Nitro deploys.
- **NOT the Remix Hydrogen framework** = the older opinionated framework. This toolkit drops into any server-capable React framework.

`@shopify/hydrogen` ships its own setup skills inside the package. After install, read them at `node_modules/@shopify/hydrogen/skills/*/SKILL.md` — especially `hydrogen-setup`, `hydrogen-request-handlers`, `hydrogen-storefront-client`, `hydrogen-cart-ui`, `hydrogen-cart-drawer`, and `hydrogen-variant-form`. This skill is the TanStack-Start-specific adapter layer around those.

## Read First

Detailed, copy-ready code templates for every file below live in [reference.md](reference.md). Read it before writing files.

## Integration Checklist

```
- [ ] 1. Install @shopify/hydrogen (PINNED exact version — see gotcha)
- [ ] 2. Env module (server-only, canonical names)
- [ ] 3. Storefront client + GraphQL queries (data.server.ts)
- [ ] 4. Server functions wrapping the data layer (loaders call these)
- [ ] 5. Request gate: createStart requestMiddleware running handleShopifyRoutes
- [ ] 6. React bindings from @shopify/hydrogen/react (cart + product)
- [ ] 7. Standard Actions runtime <script> in the root document (see gotcha)
- [ ] 8. Cart provider + drawer + product form in routes
- [ ] 9. Verify: home, collection, product, and add-to-cart all work
```

## Critical Gotchas

These three bite hard and are non-obvious. Handle them explicitly.

### 1. Pin the exact Hydrogen version — never use a caret

`@shopify/hydrogen` preview builds use prerelease versions like `0.0.0-preview-<hash>-<date>`. A caret range (`^0.0.0-preview-...`) matches the semver prerelease window `>=0.0.0-preview... <0.0.1`, and the `unstable` dist-tag (`0.0.0-unstable-...`) sorts higher alphabetically than `preview`, so the package manager silently installs a years-old `unstable` build that has **no `/react` export**. Symptom: `Cannot find module '@shopify/hydrogen/react'`.

Fix: pin the exact version with no `^`:

```json
"@shopify/hydrogen": "0.0.0-preview-0c3bff8-20260618001533"
```

Resolve the current preview version with `npm view @shopify/hydrogen dist-tags` and verify the install exports `./react`:

```bash
node -e "console.log(Object.keys(require('./node_modules/@shopify/hydrogen/package.json').exports))"
```

### 2. Cart mutations need the Standard Actions runtime script

Hydrogen's cart mutations run through `window.Shopify.actions` (the "Standard Actions" runtime), loaded from a Shopify CDN. If it is missing, every cart action throws `Standard Actions not available. Ensure the Shopify script tag is loaded before calling cart actions.`

Add this once to the root document `<head>` (TanStack Start's `shellComponent`). Use a native module script — `crossOrigin="anonymous"` in JSX:

```tsx
<script
  type="module"
  src="https://cdn.shopify.com/storefront/standard-actions.js"
  crossOrigin="anonymous"
/>
```

### 3. `quantityAvailable` requires the inventory Storefront scope

Hydrogen's built-in cart fragment always requests `quantityAvailable`, which needs the `unauthenticated_read_product_inventory` Storefront API access scope (it is **not** overridable via a custom cart fragment). If the token lacks the scope, Shopify returns the cart data (`quantityAvailable: null`) **plus** an `ACCESS_DENIED` error, and Hydrogen treats any `errors` entry as fatal — cart mutations 500 with `CartNetworkError: Something went wrong updating your cart.`

Two fixes:

- **Preferred**: grant `unauthenticated_read_product_inventory` to the Storefront token (Shopify admin → Headless / Storefront API app). Then inventory-based max-quantity capping also works.
- **Workaround** (no admin access): pass a custom `fetch` to `createStorefrontClient` that strips only that benign inventory-scope error from the GraphQL response. Full wrapper in [reference.md](reference.md#tolerant-fetch).

## Architecture

Server imports of `@shopify/hydrogen` must never enter the client bundle. Two rules enforce this:

- Keep all Hydrogen server calls in `*.server.ts` modules, and `await import()` them lazily inside TanStack Start server functions / middleware.
- The React bindings (`@shopify/hydrogen/react`) are the only Hydrogen import allowed in client components.

Request flow (mirrors Hydrogen's `hydrogen-request-handlers`, adapted to Start):

```
Request
  -> handleShopifyRoutes()      (request middleware, before routing; short-circuits /api/cart, SFAPI proxy, /checkout, cart permalinks, etc.)
  -> TanStack Start router
  -> handleShopifyRedirects()   (only when the router 404s)
  -> Start 404
```

Wire the middleware globally via `createStart` in `src/start.ts`; put the gate logic in a `createMiddleware({ type: "request" }).server(...)`. See [reference.md](reference.md#request-gate).

## Key Building Blocks

| Concern | Hydrogen API | Where it lives |
|---------|--------------|----------------|
| Storefront API client | `createStorefrontClient`, `createStorefrontRequestContext` | `*.server.ts` data layer |
| Typed queries (no codegen) | `gql` | `queries.ts` |
| Request/redirect handling | `handleShopifyRoutes`, `handleShopifyRedirects` | request middleware (gate) |
| Cart server handlers | `createCartServerHandlers` | `cart-handlers.server.ts` |
| Cart parsing (custom endpoints) | `parseCartRequest`, `EMPTY_CART_DATA` | mock cart / custom handlers |
| React cart bindings | `createCartComponents` (from `/react`) | `cart.tsx` client module |
| React product bindings | `createProductComponents` (from `/react`) | `product.tsx` client module |
| Add-to-cart guard, money | `canAddToCart`, `formatMoney` | components |

Cart mutations POST to `/api/cart` by default; the gate serves that path. Optionally support a **mock mode**: when credentials are absent, serve `/api/cart` from an in-memory cart (using the real `parseCartRequest` wire contract) so the app boots standalone. See [reference.md](reference.md#mock-mode).

## Environment Variables

Use Hydrogen's canonical names, server-only (never read `process.env` from client modules):

- `PUBLIC_STORE_DOMAIN`
- `PUBLIC_STOREFRONT_API_TOKEN`
- `PRIVATE_STOREFRONT_API_TOKEN`
- `PUBLIC_STOREFRONT_ID` (use `"0"` if none)

## Verification

After wiring, run the dev server and confirm each layer:

```bash
# Pages render with live data
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s http://localhost:3000/collections/<handle> | grep -ao 'product-card'

# Standard Actions script is in the document
curl -s http://localhost:3000/products/<handle> | grep -ao 'standard-actions.js'

# Cart endpoint responds
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/cart
```

Then test add-to-cart in a real browser (the mutation is client-side via Standard Actions) and watch the server log for `Access denied ... quantityAvailable` or `CartNetworkError`. For deeper runtime checks, use the packaged `hydrogen-smoke-test` skill.
