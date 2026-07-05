import { createFileRoute } from '@tanstack/react-router'

import { getCollections } from '#/lib/hydrogen/server-fns'
import { CollectionGridCard } from '#/components/StorefrontCards'

export const Route = createFileRoute('/collections/')({
  loader: () => getCollections(),
  component: Collections,
})

function Collections() {
  const collections = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <h1 className="display-title mb-6 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
        Collections
      </h1>
      {collections.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection: any) => (
            <CollectionGridCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <p className="demo-muted text-sm">No collections found.</p>
      )}
    </main>
  )
}
