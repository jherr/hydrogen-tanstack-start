import { createFileRoute } from '@tanstack/react-router'
import { chat, maxIterations, toServerSentEventsResponse } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'
import { openaiText } from '@tanstack/ai-openai'
import { geminiText } from '@tanstack/ai-gemini'
import { ollamaText } from '@tanstack/ai-ollama'

import { browseCatalog, searchProducts } from '#/lib/ai-tools.server'
import { addToCartToolDef, recommendProductToolDef } from '#/lib/ai-tools'

const SYSTEM_PROMPT = `You are a friendly, knowledgeable shopping assistant for an online Shopify merch store.

Your job is to help customers find great products — whether that's a single item or a coordinated set of items — and then help them add them to their cart. Only ever discuss real products returned by the tools; never invent products, prices, or details.

TOOLS AND WORKFLOW:
1. browseCatalog — Lists products across ALL categories/product types (tops, hoodies, hats, accessories, etc.). Use this FIRST for open-ended or styling requests like "make me an outfit", "what should I buy?", or "what do you sell?". It lets you see the full inventory so you can pick complementary pieces from different product types.
2. searchProducts — Use this to find a SPECIFIC item by keyword or product type (e.g. "hoodie", "dad cap", "product_type:Hat"). Great once you know what category you need.
3. recommendProduct — REQUIRED whenever you want to show a product. Pass the product's "handle". This renders a rich product card with image, price, an "Add to cart" button, and a details link. Do NOT describe products in plain prose instead of calling this tool. Call it once per product you recommend.
4. addToCart — Adds a product to the cart when the customer clearly wants it. Pass the "merchandiseId" (the "variantId" from the product) and, when helpful, the product "title".

BUILDING AN OUTFIT / MULTI-ITEM REQUESTS:
- When the customer asks for an outfit, a "look", a bundle, or "what should I get", call browseCatalog first to see everything available.
- Group the results by product type and assemble a coordinated set — ideally one item from a few DIFFERENT categories (for example a top + an outerwear layer + a hat/accessory) rather than several of the same thing.
- Prefer items that are availableForSale, and try to keep the pieces stylistically coherent (colors/theme).
- Present each piece with its own recommendProduct card, then give a short summary of the full outfit and the approximate total price.
- If browseCatalog doesn't surface a category you need, follow up with a targeted searchProducts call.

CONVERSATION STYLE:
- For vague requests you may ask ONE brief clarifying question (budget, style, size), but if the customer just says "make me an outfit", go ahead and build a reasonable one rather than stalling.
- Briefly explain WHY each piece fits (in text), but always show the product itself via recommendProduct.
- If the customer wants an item (or the whole outfit), confirm and call addToCart for each, then tell them it's in their cart.
- Be concise, warm, and helpful. Prices and product details come from the tools — do not make them up.`

export const Route = createFileRoute('/api/ai/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestSignal = request.signal
        if (requestSignal.aborted) {
          return new Response(null, { status: 499 })
        }

        const abortController = new AbortController()

        try {
          const body = await request.json()
          const { messages } = body

          let provider = 'ollama'
          let model = 'mistral:7b'
          if (process.env.ANTHROPIC_API_KEY) {
            provider = 'anthropic'
            model = 'claude-haiku-4-5'
          } else if (process.env.OPENAI_API_KEY) {
            provider = 'openai'
            model = 'gpt-4o'
          } else if (process.env.GEMINI_API_KEY) {
            provider = 'gemini'
            model = 'gemini-2.0-flash-exp'
          }

          const adapterConfig = {
            anthropic: () => anthropicText((model || 'claude-haiku-4-5') as any),
            openai: () => openaiText((model || 'gpt-4o') as any),
            gemini: () => geminiText((model || 'gemini-2.0-flash-exp') as any),
            ollama: () => ollamaText((model || 'mistral:7b') as any),
          }

          const adapter = adapterConfig[provider as keyof typeof adapterConfig]()

          const stream = chat({
            adapter,
            tools: [
              browseCatalog, // server tool: lists inventory across categories
              searchProducts, // server tool: queries the Storefront API
              recommendProductToolDef, // client renders the product card
              addToCartToolDef, // client adds to cart via Standard Actions
            ],
            systemPrompts: [SYSTEM_PROMPT],
            agentLoopStrategy: maxIterations(12),
            messages,
            abortController,
          })

          return toServerSentEventsResponse(stream, { abortController })
        } catch (error: any) {
          if (error.name === 'AbortError' || abortController.signal.aborted) {
            return new Response(null, { status: 499 })
          }
          return new Response(
            JSON.stringify({ error: 'Failed to process chat request' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
