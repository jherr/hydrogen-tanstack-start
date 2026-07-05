import { createServerFn } from '@tanstack/react-start'

export const getHome = createServerFn({ method: 'GET' }).handler(async () => {
  const { getRequest } = await import('@tanstack/react-start/server')
  const { loadHome } = await import('./data.server')
  return loadHome(getRequest())
})

export const getCollections = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { loadCollections } = await import('./data.server')
    return loadCollections(getRequest())
  },
)

export const getCollection = createServerFn({ method: 'GET' })
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { loadCollection } = await import('./data.server')
    return loadCollection(handle, getRequest())
  })

export const getProduct = createServerFn({ method: 'GET' })
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { loadProduct } = await import('./data.server')
    return loadProduct(handle, getRequest())
  })

export const getProductCard = createServerFn({ method: 'GET' })
  .validator((handle: string) => handle)
  .handler(async ({ data: handle }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { loadProductCard } = await import('./data.server')
    return loadProductCard(handle, getRequest())
  })
