import type { MoneyV2 } from '@shopify/hydrogen'

export interface Image {
  url: string
  altText?: string | null
  width?: number | null
  height?: number | null
}

export interface StorefrontVariant {
  id: string
  title: string
  availableForSale: boolean
  selectedOptions: Array<{ name: string; value: string }>
  price: MoneyV2
  compareAtPrice?: MoneyV2 | null
  image?: Image | null
  product?: { handle: string; title?: string | null } | null
}

export interface StorefrontProduct {
  id: string
  handle: string
  title: string
  description?: string
  descriptionHtml?: string
  vendor?: string | null
  productType?: string
  tags?: string[]
  featuredImage?: Image | null
  images?: { nodes: Image[] }
  priceRange: {
    minVariantPrice: MoneyV2
    maxVariantPrice?: MoneyV2
  }
  requiresSellingPlan?: boolean | null
  encodedVariantExistence?: string | null
  encodedVariantAvailability?: string | null
  options: Array<{
    name: string
    optionValues: Array<{
      name: string
      firstSelectableVariant?: StorefrontVariant | null
    }>
  }>
  selectedOrFirstAvailableVariant: StorefrontVariant | null
  adjacentVariants: StorefrontVariant[]
}

export interface ProductSummary {
  id: string
  handle: string
  title: string
  featuredImage?: Image | null
  priceRange: {
    minVariantPrice: MoneyV2
    maxVariantPrice?: MoneyV2
  }
}

export interface CollectionSummary {
  id: string
  handle: string
  title: string
  description?: string
  image?: Image | null
}
