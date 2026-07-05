import { createFileRoute } from '@tanstack/react-router'

import { getHome } from '#/lib/hydrogen/server-fns'
import {
  CollectionGridCard,
  ProductGridCard,
} from '#/components/StorefrontCards'

export const Route = createFileRoute('/')({
  loader: () => getHome(),
  component: Home,
})

function Home() {
  const { collections, products } = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-[var(--sea-ink)]">
          Featured Products
        </h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((product: any) => (
              <ProductGridCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="demo-muted text-sm">No products found.</p>
        )}
      </section>

      {collections.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-[var(--sea-ink)]">
            Shop by collection
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection: any) => (
              <CollectionGridCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
