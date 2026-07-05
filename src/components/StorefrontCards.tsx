import { Link } from '@tanstack/react-router'

import { formatPriceRange } from '#/lib/hydrogen/money'
import type { CollectionSummary, ProductSummary } from '#/lib/hydrogen/types'

export function ProductGridCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      to="/products/$handle"
      params={{ handle: product.handle }}
      className="demo-card group flex flex-col overflow-hidden p-0 no-underline transition hover:-translate-y-0.5"
    >
      <div className="aspect-square overflow-hidden bg-[var(--chip-bg)]">
        {product.featuredImage ? (
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 text-sm font-semibold text-[var(--sea-ink)]">
          {product.title}
        </h3>
        <div className="mt-auto text-base font-bold text-[var(--lagoon-deep)]">
          {formatPriceRange(
            product.priceRange.minVariantPrice,
            product.priceRange.maxVariantPrice,
          )}
        </div>
      </div>
    </Link>
  )
}

export function CollectionGridCard({
  collection,
}: {
  collection: CollectionSummary
}) {
  return (
    <Link
      to="/collections/$handle"
      params={{ handle: collection.handle }}
      className="demo-card group relative flex aspect-[3/2] items-end overflow-hidden p-0 no-underline transition hover:-translate-y-0.5"
    >
      {collection.image ? (
        <img
          src={collection.image.url}
          alt={collection.image.altText ?? collection.title}
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(79,184,178,0.35),rgba(47,106,74,0.25))]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.6),transparent_60%)]" />
      <div className="relative z-10 p-4">
        <h3 className="text-lg font-bold text-white drop-shadow">
          {collection.title}
        </h3>
      </div>
    </Link>
  )
}
