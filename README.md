# Hydrogen on TanStack Start

An AI-powered Shopify storefront built with **TanStack Start** and the framework-agnostic **`@shopify/hydrogen`** toolkit. It renders live catalog, collection, product, and cart pages against the Shopify Storefront API, and ships an AI shopping assistant that can browse the catalog, recommend products, assemble outfits, and add items to the cart.

This project demonstrates how to wire Hydrogen (the toolkit — Storefront API client, cart server handlers, and React bindings) into TanStack Start running on Nitro/Vite. It uses Hydrogen **only**, not Oxygen hosting and not the Remix-based Hydrogen framework, so it deploys anywhere Nitro deploys.

## Features

- **Live Shopify storefront** — home, collections (`/collections`, `/collections/$handle`), product detail (`/products/$handle`), and cart pages driven by the Storefront API (no codegen; typed `gql` queries).
- **Hydrogen cart** — add-to-cart, cart drawer, and cart page powered by Hydrogen's React cart bindings and the Shopify Standard Actions runtime.
- **AI shopping assistant** — a chat assistant (TanStack AI) with tools to `browseCatalog`, `searchProducts`, `recommendProduct` (rich product cards), and `addToCart`. It can build coordinated multi-item outfits from real inventory.
- **Multi-provider AI** — automatically selects Anthropic, OpenAI, Gemini, or a local Ollama fallback based on which API key is present.
- **Mock mode** — with no Shopify credentials the app still boots; the Shopify request gate is bypassed and `/api/cart` is served in-memory.
- **Light/dark theming** — no-flash theme toggle with `auto`/`light`/`dark` modes.
- **Deploy anywhere** — Nitro server output runs on any Node-compatible host.

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | [TanStack Start](https://tanstack.com/start) (Nitro + Vite) |
| Routing | [TanStack Router](https://tanstack.com/router) (file-based) |
| State | [TanStack Store](https://tanstack.com/store) |
| Commerce | [`@shopify/hydrogen`](https://shopify.dev/docs/api/hydrogen) toolkit + Storefront API |
| AI | [TanStack AI](https://tanstack.com/) (Anthropic / OpenAI / Gemini / Ollama) |
| UI | React 19, Tailwind CSS v4, Lucide icons |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)

### 1. Install dependencies

```bash
pnpm install
```

> **Note:** `@shopify/hydrogen` is pinned to an exact preview version on purpose. Do **not** change it to a caret range — a caret can silently resolve to an old `unstable` build that lacks the `/react` export.

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# AI provider — set at least one (Anthropic is preferred when present)
ANTHROPIC_API_KEY=

# Shopify Storefront API (optional — omit to run in mock mode)
PUBLIC_STORE_DOMAIN=
PUBLIC_STOREFRONT_API_TOKEN=
PRIVATE_STOREFRONT_API_TOKEN=
```

**Shopify credentials** (optional): create a Headless / Storefront API app in the Shopify admin.
- `PUBLIC_STORE_DOMAIN` — e.g. `your-shop.myshopify.com`
- `PUBLIC_STOREFRONT_API_TOKEN` — public Storefront API token
- `PRIVATE_STOREFRONT_API_TOKEN` — private Storefront API token
- `PUBLIC_STOREFRONT_ID` — optional; defaults to `0`

Grant the token the `unauthenticated_read_product_inventory` scope, otherwise Hydrogen's cart mutations fail with `CartNetworkError` (Hydrogen always requests `quantityAvailable`).

If Shopify credentials are absent, the app runs in **mock mode**: storefront pages that need live data will be empty, but the app boots and `/api/cart` is served from an in-memory cart.

**AI provider** (at least one recommended): the chat route picks a provider in this priority order based on which key is set:

| Priority | Env var | Model |
|----------|---------|-------|
| 1 | `ANTHROPIC_API_KEY` | `claude-haiku-4-5` |
| 2 | `OPENAI_API_KEY` | `gpt-4o` |
| 3 | `GEMINI_API_KEY` | `gemini-2.0-flash-exp` |
| fallback | _(none)_ | local Ollama `mistral:7b` |

### 3. Run the dev server

```bash
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the dev server on port 3000 |
| `pnpm build` | Build for production (Nitro output) |
| `pnpm preview` | Preview the production build |
| `pnpm test` | Run the Vitest test suite |
| `pnpm generate-routes` | Regenerate the TanStack Router route tree |

## Project Structure

```
src/
├── routes/                    # File-based routes
│   ├── __root.tsx             # Root document (theme + Standard Actions script + cart provider)
│   ├── index.tsx              # Home
│   ├── collections/           # Collection list + detail
│   ├── products/$handle.tsx   # Product detail
│   ├── cart.tsx               # Cart page
│   └── api.ai.chat.ts         # AI chat endpoint (multi-provider, tool-calling)
├── components/                # Header, Footer, CartDrawer, AI assistant, product cards, theme toggle
├── lib/
│   ├── ai-tools.ts            # Shared AI tool schemas (client + server safe)
│   ├── ai-tools.server.ts     # Server implementations (query the Storefront API)
│   ├── ai-hook.ts             # Client-side AI chat hook
│   └── hydrogen/              # Hydrogen adapter layer
│       ├── env.ts             # Server-only Shopify env (canonical names)
│       ├── gate.ts            # Request middleware: handleShopifyRoutes / redirects
│       ├── client.server.ts   # Storefront client
│       ├── data.server.ts     # Data layer (search / list catalog)
│       ├── queries.ts         # Typed gql queries
│       ├── cart-handlers.server.ts  # Hydrogen cart server handlers
│       ├── cart.tsx           # React cart bindings
│       └── product.tsx        # React product bindings
└── start.ts                   # createStart — registers the Shopify request gate
```

## How Hydrogen is wired in

- **Request gate** (`src/start.ts` → `src/lib/hydrogen/gate.ts`): a `createStart` request middleware runs `handleShopifyRoutes` before routing (owns `/api/cart`, the SFAPI proxy, `/checkout`, cart permalinks) and `handleShopifyRedirects` after a 404. It short-circuits entirely when no credentials are configured.
- **Server-only imports**: all `@shopify/hydrogen` server calls live in `*.server.ts` modules and are `await import()`ed lazily so they never enter the client bundle. Only `@shopify/hydrogen/react` bindings are imported in client components.
- **Standard Actions runtime**: cart mutations run through `window.Shopify.actions`, loaded via a `<script type="module">` in the root document `<head>`. Without it, cart actions throw.

For a deeper, copy-ready guide to the integration (and the non-obvious gotchas), see [`.skills/hydrogen-tanstack-start/SKILL.md`](.skills/hydrogen-tanstack-start/SKILL.md) and [`reference.md`](.skills/hydrogen-tanstack-start/reference.md).

## Building for Production

```bash
pnpm build
node dist/server/index.mjs
```

The build output is a self-contained Node server. Push the `dist/` directory to your host (Render, Fly.io, a VPS, etc.) and run the command above. For host-specific presets (Vercel, Netlify, Cloudflare, AWS Lambda) see the [Nitro deployment docs](https://nitro.build/deploy).

## Testing

```bash
pnpm test
```

This project uses [Vitest](https://vitest.dev/).

## Learn More

- [TanStack Start](https://tanstack.com/start)
- [TanStack Router](https://tanstack.com/router)
- [Shopify Hydrogen](https://shopify.dev/docs/api/hydrogen)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
