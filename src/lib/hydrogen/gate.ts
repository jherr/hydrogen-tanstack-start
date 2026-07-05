import { createMiddleware } from '@tanstack/react-start'

// Runs before routing: short-circuits Hydrogen-owned routes (/api/cart, the
// SFAPI proxy, /checkout, cart permalinks, etc.) and applies Shopify redirects
// after a 404.
export const shopifyGate = createMiddleware({ type: 'request' }).server(
  async ({ request, next }) => {
    const { env } = await import('./env')
    if (!env.hasCreds) return next()

    const { handleShopifyRoutes, handleShopifyRedirects } = await import(
      '@shopify/hydrogen'
    )
    const { getRequestScopedStorefrontClient } = await import('./client.server')
    const { cartHandlers } = await import('./cart-handlers.server')

    const storefrontClient = getRequestScopedStorefrontClient(request)

    const hit = await handleShopifyRoutes({
      request,
      storefrontClient,
      handlers: [cartHandlers],
    })
    if (hit) return hit

    const result = await next()
    const response = result.response

    if (response.status === 404) {
      const redirect = await handleShopifyRedirects({ request, storefrontClient })
      if (redirect) {
        storefrontClient.requestContext.applyResponseHeaders(redirect.headers)
        return redirect
      }
    }
    storefrontClient.requestContext.applyResponseHeaders(response.headers)
    return result
  },
)
