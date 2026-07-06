# Hydrogen on TanStack Start — Code Reference

Copy-ready templates for each integration file. Paths assume a `src/lib/hydrogen/` folder for the integration layer and `src/routes/` for TanStack Start routes. Adapt names to the app.

## Install

```bash
# Pin the EXACT preview version — no caret. Resolve current with:
#   npm view @shopify/hydrogen dist-tags
npm install @shopify/hydrogen@0.0.0-preview-<hash>-<date>
```

Verify the `./react` export exists:

```bash
node -e "console.log(Object.keys(require('./node_modules/@shopify/hydrogen/package.json').exports))"
# expect: [ '.', './storefront-api-types', ..., './react', './cdn' ]
```

## env.ts (server-only)

```ts
const storeDomain = process.env.PUBLIC_STORE_DOMAIN ?? "";
const privateToken = process.env.PRIVATE_STOREFRONT_API_TOKEN ?? "";
const publicToken = process.env.PUBLIC_STOREFRONT_API_TOKEN ?? "";
const storefrontId = process.env.PUBLIC_STOREFRONT_ID ?? "0";

// No creds => run on fixtures + in-memory mock cart so the app boots standalone.
const hasCreds = Boolean(storeDomain && (privateToken || publicToken));

export const env = {
  storeDomain,
  privateToken,
  publicToken,
  storefrontId,
  hasCreds,
  i18n: { country: "US" as const, language: "EN" as const },
  locale: "en-US",
};
```

## queries.ts

`gql()` gives typed documents against the schema with no codegen step.

```ts
import { gql } from "@shopify/hydrogen";

export const PRODUCT_QUERY = gql(`
  query Product($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id handle title description
      featuredImage { url altText width height }
      priceRange { minVariantPrice { amount currencyCode } }
      encodedVariantExistence
      encodedVariantAvailability
      options {
        name
        optionValues { name firstSelectableVariant { ...Variant } }
      }
      selectedOrFirstAvailableVariant { ...Variant }
      adjacentVariants { ...Variant }
    }
  }
  fragment Variant on ProductVariant {
    id title availableForSale
    price { amount currencyCode }
    selectedOptions { name value }
    image { url altText }
    product { handle title }
  }
`);
// COLLECTIONS_QUERY / COLLECTION_QUERY follow the same @inContext pattern.
```

## data.server.ts (Storefront client + loaders)

```ts
import {
  createStorefrontClient,
  createStorefrontRequestContext,
} from "@shopify/hydrogen";
import { env } from "./env";
import { PRODUCT_QUERY } from "./queries";

function getBuyerIp(request?: Request): string {
  const h = request?.headers;
  return (
    h?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h?.get("x-real-ip") ||
    "127.0.0.1"
  );
}

export function getStorefrontClient(request?: Request) {
  return createStorefrontClient({
    type: "private",
    config: {
      storeDomain: env.storeDomain,
      privateStorefrontToken: env.privateToken,
      buyerIp: getBuyerIp(request),
      requestContext: request ? createStorefrontRequestContext(request) : undefined,
      i18n: env.i18n,
    },
  });
}

const ctx = { country: env.i18n.country, language: env.i18n.language };

export async function loadProduct(handle: string, request?: Request) {
  if (!env.hasCreds) return /* fixtureProduct(handle) */ null;
  const { data } = await getStorefrontClient(request).graphql(PRODUCT_QUERY, {
    variables: { handle, ...ctx },
  });
  return data?.product ?? null;
}
```

## server-fns.ts (keep Hydrogen server imports off the client)

```ts
import { createServerFn } from "@tanstack/react-start";

export const getProduct = createServerFn({ method: "GET" })
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const { loadProduct } = await import("./data.server");
    return loadProduct(handle);
  });
```

Route loaders call these server functions; the `.server.ts` bodies are stripped from the client bundle.

## start.ts (register global request middleware)

```ts
import { createStart } from "@tanstack/react-start";
import { shopifyGate } from "./lib/hydrogen/gate";

export const startInstance = createStart(() => ({
  requestMiddleware: [shopifyGate],
}));
```

## Request gate {#request-gate}

`gate.ts` — runs before routing, short-circuits Hydrogen-owned paths, runs redirects after a 404. Includes the tolerant fetch (gotcha 3) and the mock fallback (no creds).

```ts
import { createMiddleware } from "@tanstack/react-start";

const tolerantSfapiFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (!(response.headers.get("content-type") ?? "").includes("application/json"))
    return response;
  let json: any;
  try { json = JSON.parse(await response.clone().text()); } catch { return response; }
  if (!Array.isArray(json?.errors)) return response;
  const isInventoryScopeError = (e: any) =>
    /unauthenticated_read_product_inventory/.test(
      `${e?.extensions?.requiredAccess ?? ""} ${e?.message ?? ""}`,
    );
  const kept = json.errors.filter((e: any) => !isInventoryScopeError(e));
  if (kept.length === json.errors.length) return response;
  if (kept.length === 0) delete json.errors; else json.errors = kept;
  return new Response(JSON.stringify(json), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

export const shopifyGate = createMiddleware({ type: "request" }).server(
  async ({ request, next }) => {
    const { env } = await import("./env");

    // No creds: serve /api/cart from the in-memory mock, everything else routes.
    if (!env.hasCreds) {
      const { handleMockCart } = await import("./mock-cart.server");
      const mock = await handleMockCart(request);
      return mock ?? next();
    }

    const {
      createStorefrontClient,
      createStorefrontRequestContext,
      handleShopifyRoutes,
      handleShopifyRedirects,
    } = await import("@shopify/hydrogen");
    const { cartHandlers } = await import("./cart-handlers.server");

    const buyerIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const storefrontClient = createStorefrontClient({
      type: "private",
      config: {
        storeDomain: env.storeDomain,
        privateStorefrontToken: env.privateToken,
        buyerIp,
        requestContext: createStorefrontRequestContext(request),
        i18n: env.i18n,
        fetch: tolerantSfapiFetch, // gotcha 3 workaround
      },
    });

    // Before routing: short-circuits /api/cart, SFAPI proxy, /checkout, cart permalinks, etc.
    const hit = await handleShopifyRoutes({
      request,
      storefrontClient,
      handlers: [cartHandlers],
    });
    if (hit) return hit;

    const result = await next();
    const response = result.response;

    if (response.status === 404) {
      const redirect = await handleShopifyRedirects({ request, storefrontClient });
      if (redirect) {
        storefrontClient.requestContext.applyResponseHeaders(redirect.headers);
        return redirect;
      }
    }
    storefrontClient.requestContext.applyResponseHeaders(response.headers);
    return result;
  },
);
```

### Tolerant fetch {#tolerant-fetch}

The `tolerantSfapiFetch` above is the gotcha-3 workaround: it strips only the `unauthenticated_read_product_inventory` `ACCESS_DENIED` error from GraphQL responses so cart mutations succeed when the token lacks that scope. Remove it once the scope is granted in Shopify admin (it becomes a harmless no-op either way).

## cart-handlers.server.ts

```ts
import { createCartServerHandlers } from "@shopify/hydrogen";

// Credential-free to construct; only calls the SFAPI when invoked. Exported so
// the React bindings can derive the cart type from `typeof cartHandlers`.
export const cartHandlers = createCartServerHandlers();
```

## React bindings (client modules)

`cart.tsx`:

```tsx
import { createCartComponents } from "@shopify/hydrogen/react";
import type { cartHandlers } from "./cart-handlers.server";

export const { CartProvider, useCart, useCartForm } =
  createCartComponents<typeof cartHandlers>();
```

`product.tsx`:

```tsx
import { createProductComponents } from "@shopify/hydrogen/react";

export const { ProductProvider, useProductForm } =
  createProductComponents<any>(); // pass the query's product type for full typing
```

## Root document (Standard Actions script) {#root}

In the TanStack Start root route's `shellComponent`, add the Standard Actions runtime once in `<head>` (gotcha 2):

```tsx
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="module"
          src="https://cdn.shopify.com/storefront/standard-actions.js"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <CartProvider>
          {/* Nav, main, CartDrawer, etc. */}
          {children}
        </CartProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

## Product form (add to cart)

```tsx
import { canAddToCart } from "@shopify/hydrogen";
import { useProductForm } from "../lib/hydrogen/product";

function AddToCart({ product, openCart }: { product: any; openCart: () => void }) {
  const { formProps, register, options, selectedVariant } = useProductForm();
  const enabled = canAddToCart(product, options as any);
  return (
    <form {...formProps({ afterSubmit: () => openCart() })}>
      <input type="hidden" {...register("merchandiseId", {})} />
      <input type="hidden" {...register("quantity", { value: 1 })} />
      <button type="submit" disabled={!enabled}>
        {selectedVariant?.availableForSale ? "Add to cart" : "Sold out"}
      </button>
    </form>
  );
}
```

The cart line-item form contract (drawer + `/cart` page) must stay identical: hidden `register("set")`, `register("lineId", { value })`, and an interactive `register("quantity", { value, interactive: true })`. See the packaged `hydrogen-cart-ui` and `hydrogen-cart-drawer` skills.

## Mock mode {#mock-mode}

`mock-cart.server.ts` — serve `/api/cart` from an in-memory cart when creds are absent, using the real `parseCartRequest` wire contract so the client behaves identically:

```ts
import { parseCartRequest, EMPTY_CART_DATA } from "@shopify/hydrogen";
import type { CartData } from "@shopify/hydrogen";

let lines: any[] = [];

export async function handleMockCart(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/cart") return null;
  if (request.method === "GET") return json({ cart: snapshot() });
  if (request.method === "POST") {
    const action = await parseCartRequest(request); // { intent: "add"|"update"|"remove", ... }
    // mutate `lines` per action.intent ...
    return json({ cart: snapshot() });
  }
  return null;
}

function snapshot(): CartData {
  return { ...EMPTY_CART_DATA, lines: { nodes: lines } } as unknown as CartData;
}
function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}
```

## vite.config.ts (reference plugin order)

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [nitro(), tanstackStart(), viteReact()],
});
```

## Out of Hydrogen's scope

`@shopify/hydrogen` does not ship helpers for customer accounts/login, image optimization, or SEO. Build these with TanStack Start primitives + Storefront API data (Customer Account API for auth, `<img srcset>` with Shopify CDN transforms for images, the router's head API for meta/JSON-LD).
