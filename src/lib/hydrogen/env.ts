// Server-only Shopify/Hydrogen environment. Never import from client modules.
const storeDomain = process.env.PUBLIC_STORE_DOMAIN ?? ''
const privateToken = process.env.PRIVATE_STOREFRONT_API_TOKEN ?? ''
const publicToken = process.env.PUBLIC_STOREFRONT_API_TOKEN ?? ''
const storefrontId = process.env.PUBLIC_STOREFRONT_ID ?? '0'

const hasCreds = Boolean(storeDomain && (privateToken || publicToken))

export const env = {
  storeDomain,
  privateToken,
  publicToken,
  storefrontId,
  hasCreds,
  i18n: { country: 'US' as const, language: 'EN' as const },
  locale: 'en-US',
}
