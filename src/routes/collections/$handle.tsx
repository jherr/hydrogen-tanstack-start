import { createFileRoute, notFound } from '@tanstack/react-router'

import { getCollection } from '#/lib/hydrogen/server-fns'
import { ProductGridCard } from '#/components/StorefrontCards'

export const Route = createFileRoute('/collections/$handle')({
  loader: async ({ params }) => {
    const collection = await getCollection({ data: params.handle })
    if (!collection) throw notFound()
    return collection
  },
  component: Collection,
})

function Collection() {
  const collection = Route.useLoaderData()
  const products = collection.products?.nodes ?? []

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <h1 className="display-title mb-2 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
        {collection.title}
      </h1>
      {collection.description ? (
        <p className="demo-muted mb-6 max-w-2xl text-sm">
          {collection.description}
        </p>
      ) : null}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((product: any) => (
            <ProductGridCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="demo-muted text-sm">No products in this collection.</p>
      )}
    </main>
  )
}
