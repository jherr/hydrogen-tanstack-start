import { browseCatalogToolDef, searchProductsToolDef } from './ai-tools'

// Server-side implementation of the catalog search tool. Runs inside the chat
// request, so it can read the request context for a per-buyer Storefront client.
export const searchProducts = searchProductsToolDef.server(
  async ({ query, first }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { searchProducts: runSearch } = await import('./hydrogen/data.server')
    let request: Request | undefined
    try {
      request = getRequest()
    } catch {
      request = undefined
    }
    return runSearch(query, first ?? 6, request)
  },
)

// Server-side implementation of the catalog browse tool. Returns a wide slice
// of the inventory across product types so the model can assemble outfits.
export const browseCatalog = browseCatalogToolDef.server(async ({ first }) => {
  const { getRequest } = await import('@tanstack/react-start/server')
  const { listCatalog } = await import('./hydrogen/data.server')
  let request: Request | undefined
  try {
    request = getRequest()
  } catch {
    request = undefined
  }
  return listCatalog(first ?? 50, request)
})
