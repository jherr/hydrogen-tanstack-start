import {
  createStorefrontClient,
  createStorefrontRequestContext,
} from '@shopify/hydrogen'
import { env } from './env'

export function getBuyerIp(request?: Request): string {
  const h = request?.headers
  return (
    h?.get('oxygen-buyer-ip') ||
    h?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h?.get('x-real-ip') ||
    '127.0.0.1'
  )
}

// Strips only the benign `unauthenticated_read_product_inventory` ACCESS_DENIED
// error so cart mutations don't 500 when the token lacks the inventory scope.
export const tolerantSfapiFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init)
  if (!(response.headers.get('content-type') ?? '').includes('application/json'))
    return response
  let json: any
  try {
    json = JSON.parse(await response.clone().text())
  } catch {
    return response
  }
  if (!Array.isArray(json?.errors)) return response
  const isInventoryScopeError = (e: any) =>
    /unauthenticated_read_product_inventory/.test(
      `${e?.extensions?.requiredAccess ?? ''} ${e?.message ?? ''}`,
    )
  const kept = json.errors.filter((e: any) => !isInventoryScopeError(e))
  if (kept.length === json.errors.length) return response
  if (kept.length === 0) delete json.errors
  else json.errors = kept
  return new Response(JSON.stringify(json), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

export function getStorefrontClient(request?: Request) {
  return createStorefrontClient({
    type: 'private',
    config: {
      storeDomain: env.storeDomain,
      privateStorefrontToken: env.privateToken,
      buyerIp: getBuyerIp(request),
      requestContext: request
        ? createStorefrontRequestContext(request)
        : undefined,
      i18n: env.i18n,
      fetch: tolerantSfapiFetch,
    },
  })
}

// Request-scoped client with a guaranteed requestContext, required by
// handleShopifyRoutes / handleShopifyRedirects and cart handlers.
export function getRequestScopedStorefrontClient(request: Request) {
  return createStorefrontClient({
    type: 'private',
    config: {
      storeDomain: env.storeDomain,
      privateStorefrontToken: env.privateToken,
      buyerIp: getBuyerIp(request),
      requestContext: createStorefrontRequestContext(request),
      i18n: env.i18n,
      fetch: tolerantSfapiFetch,
    },
  })
}
