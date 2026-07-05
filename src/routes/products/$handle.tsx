import { useState } from 'react'
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { canAddToCart } from '@shopify/hydrogen'

import { getProduct } from '#/lib/hydrogen/server-fns'
import { ProductProvider, useProductForm } from '#/lib/hydrogen/product'
import { formatPrice } from '#/lib/hydrogen/money'
import { openCartDrawer } from '#/components/CartDrawer'
import type { StorefrontProduct } from '#/lib/hydrogen/types'

export const Route = createFileRoute('/products/$handle')({
  validateSearch: (search: Record<string, unknown>) => search as Record<string, string>,
  loader: async ({ params }) => {
    const product = await getProduct({ data: params.handle })
    if (!product) throw notFound()
    return product as StorefrontProduct
  },
  component: ProductRoute,
})

function ProductRoute() {
  const product = Route.useLoaderData()
  const navigate = useNavigate()

  return (
    <ProductProvider
      product={product}
      onSelect={(result) => {
        const search: Record<string, string> = {}
        for (const option of result.selectedOptions) search[option.name] = option.value
        navigate({
          to: '/products/$handle',
          params: { handle: product.handle },
          search,
          replace: true,
          resetScroll: false,
        })
      }}
    >
      <ProductView product={product} />
    </ProductProvider>
  )
}

function ProductView({ product }: { product: StorefrontProduct }) {
  const { options, selectedVariant, register, formProps, errors } =
    useProductForm()
  const [gallery, setGallery] = useState(
    product.featuredImage?.url ?? product.selectedOrFirstAvailableVariant?.image?.url ?? null,
  )

  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice
  const compareAt = selectedVariant?.compareAtPrice
  const enabled = canAddToCart(product, options)
  const images = product.images?.nodes ?? []

  const ctaLabel = enabled
    ? 'Add to cart'
    : selectedVariant === null
      ? 'Select options'
      : 'Sold out'

  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="demo-card aspect-square overflow-hidden p-0">
            {gallery ? (
              <img
                src={gallery}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((image) => (
                <button
                  key={image.url}
                  onClick={() => setGallery(image.url)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border ${
                    gallery === image.url
                      ? 'border-[var(--lagoon-deep)]'
                      : 'border-[var(--line)]'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.altText ?? ''}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          {product.vendor ? (
            <p className="island-kicker mb-2">{product.vendor}</p>
          ) : null}
          <h1 className="display-title mb-3 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
            {product.title}
          </h1>
          <div className="mb-5 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-[var(--lagoon-deep)]">
              {formatPrice(price)}
            </span>
            {compareAt && compareAt.amount !== price.amount ? (
              <span className="demo-muted text-lg line-through">
                {formatPrice(compareAt)}
              </span>
            ) : null}
          </div>

          {options.map((option) => (
            <div key={option.name} className="mb-4">
              <p className="mb-2 text-sm font-semibold text-[var(--sea-ink)]">
                {option.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isLink = value.handle !== product.handle
                  const classes = `rounded-lg border px-3 py-1.5 text-sm transition ${
                    value.selected
                      ? 'border-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.16)] text-[var(--sea-ink)]'
                      : 'border-[var(--line)] text-[var(--sea-ink-soft)] hover:border-[var(--lagoon-deep)]'
                  } ${!value.available ? 'line-through opacity-60' : ''}`
                  if (isLink) {
                    return (
                      <a
                        key={value.name}
                        href={`/products/${value.handle}`}
                        className={`${classes} no-underline`}
                      >
                        {value.name}
                      </a>
                    )
                  }
                  return (
                    <button
                      key={value.name}
                      type="button"
                      aria-pressed={value.selected}
                      disabled={!value.exists}
                      {...register('optionValue', {
                        optionName: option.name,
                        value: value.name,
                      })}
                      className={classes}
                    >
                      {value.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <form {...formProps({ afterSubmit: () => openCartDrawer() })} className="mb-6 mt-6">
            <input type="hidden" {...register('merchandiseId', {})} />
            <input type="hidden" {...register('quantity', { value: 1 })} />
            <button
              type="submit"
              disabled={!enabled}
              className="demo-button w-full justify-center py-3 sm:w-auto sm:px-10"
            >
              {ctaLabel}
            </button>
          </form>

          {errors.userErrors.length > 0 ? (
            <div className="demo-alert demo-alert-danger mb-4" role="alert">
              {errors.userErrors.map((e, i) => (
                <p key={i} className="m-0 text-sm">
                  {e.message}
                </p>
              ))}
            </div>
          ) : null}

          {product.descriptionHtml ? (
            <div
              className="prose prose-sm max-w-none text-[var(--sea-ink-soft)]"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : product.description ? (
            <p className="text-sm text-[var(--sea-ink-soft)]">
              {product.description}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
