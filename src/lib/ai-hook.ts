import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from '@tanstack/ai-react'
import type { InferChatMessages } from '@tanstack/ai-react'
import { clientTools } from '@tanstack/ai-client'

import {
  addToCartToolDef,
  recommendProductToolDef,
} from '#/lib/ai-tools'
import { getProductCard } from '#/lib/hydrogen/server-fns'

// Renders a product card in the chat. Fetches fresh, accurate product data from
// the Storefront API (never trusts model-authored prices/images).
const recommendProductClient = recommendProductToolDef.client(
  async ({ handle }) => getProductCard({ data: handle }),
)

// Adds a variant to the cart client-side via the Shopify Standard Actions
// runtime, so the cart drawer/count update optimistically.
const addToCartClient = addToCartToolDef.client(
  async ({ merchandiseId, quantity, title }) => {
    const actions =
      typeof window !== 'undefined' ? window.Shopify?.actions : undefined
    if (!actions?.updateCart) {
      return {
        success: false,
        message: 'The cart is not ready yet. Please try again in a moment.',
      }
    }
    try {
      await actions.updateCart(
        { lines: [{ merchandiseId, quantity: quantity ?? 1 }] },
        { event: { context: 'product' } },
      )
      return {
        success: true,
        message: `Added ${title ?? 'the item'} to your cart.`,
      }
    } catch {
      return {
        success: false,
        message: 'Sorry, I could not add that to your cart.',
      }
    }
  },
)

const chatOptions = createChatClientOptions({
  connection: fetchServerSentEvents('/api/ai/chat'),
  tools: clientTools(recommendProductClient, addToCartClient),
})

export type ChatMessages = InferChatMessages<typeof chatOptions>

export const useShopAssistantChat = () => useChat(chatOptions)
