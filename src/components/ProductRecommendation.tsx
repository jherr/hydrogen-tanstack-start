import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ShoppingCart, Check } from 'lucide-react'

import { showAIAssistant } from './demo-AIAssistant'
import { formatAmount } from '#/lib/hydrogen/money'

export interface ProductCardData {
  id: string
  variantId: string
  handle: string
  title: string
  description: string
  price: string
  currencyCode: string
  image: string | null
  imageAlt: string | null
  availableForSale: boolean
}

export default function ProductRecommendation({
  product,
}: {
  product: ProductCardData
}) {
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  if (!product) return null

  const addToCart = async () => {
    const actions =
      typeof window !== 'undefined' ? window.Shopify?.actions : undefined
    if (!actions?.updateCart || !product.variantId) return
    setAdding(true)
    try {
      await actions.updateCart(
        { lines: [{ merchandiseId: product.variantId, quantity: 1 }] },
        { event: { context: 'product' } },
      )
      setAdded(true)
      setTimeout(() => setAdded(false), 2500)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="demo-card my-4 overflow-hidden p-0">
      {product.image ? (
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={product.image}
            alt={product.imageAlt ?? product.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
          {product.title}
        </h3>
        {product.description ? (
          <p className="demo-muted mb-3 line-clamp-2 text-sm">
            {product.description}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold text-[var(--lagoon-deep)]">
            {formatAmount(product.price, product.currencyCode)}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigate({
                  to: '/products/$handle',
                  params: { handle: product.handle },
                })
                showAIAssistant.setState(() => false)
              }}
              className="demo-button demo-button-secondary px-3 py-1.5 text-sm"
            >
              Details
            </button>
            <button
              onClick={addToCart}
              disabled={!product.availableForSale || adding}
              className="demo-button px-3 py-1.5 text-sm"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  {product.availableForSale ? 'Add to cart' : 'Sold out'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
