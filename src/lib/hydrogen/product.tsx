import { createProductComponents } from '@shopify/hydrogen/react'
import type { StorefrontProduct } from './types'

export const { ProductProvider, useProduct, useProductForm } =
  createProductComponents<StorefrontProduct>()
