import { createCartComponents } from '@shopify/hydrogen/react'
import type { cartHandlers } from './cart-handlers.server'

export const { CartProvider, useCart, useOptionalCart, useCartForm } =
  createCartComponents<typeof cartHandlers>()
