import { getStorefrontClient } from './client.server'
import { env } from './env'
import {
  CATALOG_QUERY,
  COLLECTION_QUERY,
  COLLECTIONS_QUERY,
  HOME_QUERY,
  PRODUCT_QUERY,
  SEARCH_PRODUCTS_QUERY,
} from './queries'

const ctx = { country: env.i18n.country, language: env.i18n.language }

export async function loadHome(request?: Request) {
  const { data } = await getStorefrontClient(request).graphql(HOME_QUERY, {
    variables: { ...ctx },
  })
  return {
    collections: data?.collections?.nodes ?? [],
    products: data?.products?.nodes ?? [],
  }
}

export async function loadCollections(request?: Request) {
  const { data } = await getStorefrontClient(request).graphql(
    COLLECTIONS_QUERY,
    { variables: { ...ctx } },
  )
  return data?.collections?.nodes ?? []
}

export async function loadCollection(handle: string, request?: Request) {
  const { data } = await getStorefrontClient(request).graphql(COLLECTION_QUERY, {
    variables: { handle, ...ctx },
  })
  return data?.collection ?? null
}

export async function loadProduct(handle: string, request?: Request) {
  const { data } = await getStorefrontClient(request).graphql(PRODUCT_QUERY, {
    variables: { handle, ...ctx },
  })
  return data?.product ?? null
}

export interface AIProduct {
  id: string
  variantId: string
  handle: string
  title: string
  description: string
  productType: string
  tags: string[]
  price: string
  currencyCode: string
  image: string | null
  availableForSale: boolean
}

function toAIProduct(p: any): AIProduct {
  return {
    id: p.id,
    variantId: p.selectedOrFirstAvailableVariant?.id ?? '',
    handle: p.handle,
    title: p.title,
    description: (p.description ?? '').slice(0, 500),
    productType: p.productType ?? '',
    tags: p.tags ?? [],
    price:
      p.selectedOrFirstAvailableVariant?.price?.amount ??
      p.priceRange?.minVariantPrice?.amount ??
      '0',
    currencyCode:
      p.selectedOrFirstAvailableVariant?.price?.currencyCode ??
      p.priceRange?.minVariantPrice?.currencyCode ??
      'USD',
    image: p.featuredImage?.url ?? null,
    availableForSale: p.selectedOrFirstAvailableVariant?.availableForSale ?? true,
  }
}

export async function searchProducts(
  query: string,
  first = 6,
  request?: Request,
): Promise<AIProduct[]> {
  try {
    const { data } = await getStorefrontClient(request).graphql(
      SEARCH_PRODUCTS_QUERY,
      { variables: { query, first, ...ctx } },
    )
    const nodes = data?.products?.nodes ?? []
    return nodes.map(toAIProduct)
  } catch (error) {
    console.error('searchProducts failed', error)
    return []
  }
}

// Returns a broad slice of the catalog (best sellers across every product
// type) so the assistant can reason about complementary items — e.g. build an
// outfit from a tee + hoodie + hat — instead of relying on a single keyword
// search that tends to return one category.
export async function listCatalog(
  first = 50,
  request?: Request,
): Promise<AIProduct[]> {
  try {
    const { data } = await getStorefrontClient(request).graphql(CATALOG_QUERY, {
      variables: { first, ...ctx },
    })
    const nodes = data?.products?.nodes ?? []
    return nodes.map(toAIProduct)
  } catch (error) {
    console.error('listCatalog failed', error)
    return []
  }
}

export interface ProductCard {
  id: string
  variantId: string
  handle: string
  title: string
  description: string
  price: string
  currencyCode: string
  image: string | null
  imageAlt: string | null
  availableForSale: boolean
}

export async function loadProductCard(
  handle: string,
  request?: Request,
): Promise<ProductCard | null> {
  const product = await loadProduct(handle, request)
  if (!product) return null
  const variant = product.selectedOrFirstAvailableVariant
  return {
    id: product.id,
    variantId: variant?.id ?? '',
    handle: product.handle,
    title: product.title,
    description: (product.description ?? '').slice(0, 240),
    price:
      variant?.price?.amount ?? product.priceRange?.minVariantPrice?.amount ?? '0',
    currencyCode:
      variant?.price?.currencyCode ??
      product.priceRange?.minVariantPrice?.currencyCode ??
      'USD',
    image: product.featuredImage?.url ?? variant?.image?.url ?? null,
    imageAlt: product.featuredImage?.altText ?? product.title,
    availableForSale: variant?.availableForSale ?? true,
  }
}
