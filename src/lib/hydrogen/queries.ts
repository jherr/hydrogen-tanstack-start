import { gql } from '@shopify/hydrogen'

export const PRODUCT_CARD_FRAGMENT = gql(`
  fragment ProductCard on Product {
    id
    handle
    title
    featuredImage { url altText width height }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
  }
`)

export const HOME_QUERY = gql(
  `
  query Home($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 6, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        description
        image { url altText width height }
      }
    }
    products(first: 8, sortKey: BEST_SELLING) {
      nodes { ...ProductCard }
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
)

export const COLLECTIONS_QUERY = gql(`
  query Collections($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collections(first: 24, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        description
        image { url altText width height }
      }
    }
  }
`)

export const COLLECTION_QUERY = gql(
  `
  query Collection($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image { url altText width height }
      products(first: 24) {
        nodes { ...ProductCard }
      }
    }
  }
`,
  [PRODUCT_CARD_FRAGMENT],
)

const PRODUCT_VARIANT_FRAGMENT = gql(`
  fragment Variant on ProductVariant {
    id
    title
    availableForSale
    price { amount currencyCode }
    compareAtPrice { amount currencyCode }
    selectedOptions { name value }
    image { url altText width height }
    product { handle title }
  }
`)

export const PRODUCT_QUERY = gql(
  `
  query Product($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      vendor
      productType
      tags
      featuredImage { url altText width height }
      images(first: 8) { nodes { url altText width height } }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
      requiresSellingPlan
      encodedVariantExistence
      encodedVariantAvailability
      options {
        name
        optionValues {
          name
          firstSelectableVariant { ...Variant }
        }
      }
      selectedOrFirstAvailableVariant { ...Variant }
      adjacentVariants { ...Variant }
    }
  }
`,
  [PRODUCT_VARIANT_FRAGMENT],
)

export const SEARCH_PRODUCTS_QUERY = gql(`
  query SearchProducts($query: String!, $first: Int!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: $first, query: $query, sortKey: RELEVANCE) {
      nodes {
        id
        handle
        title
        description
        productType
        tags
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
        selectedOrFirstAvailableVariant {
          id
          title
          availableForSale
          price { amount currencyCode }
        }
      }
    }
  }
`)

export const CATALOG_QUERY = gql(`
  query Catalog($first: Int!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        id
        handle
        title
        description
        productType
        tags
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
        selectedOrFirstAvailableVariant {
          id
          title
          availableForSale
          price { amount currencyCode }
        }
      }
    }
  }
`)
