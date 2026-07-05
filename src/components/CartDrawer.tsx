import { Store } from '@tanstack/store'
import { useStore } from '@tanstack/react-store'
import { X, ShoppingBag } from 'lucide-react'

import { useCart, useCartForm } from '#/lib/hydrogen/cart'
import { formatAmount } from '#/lib/hydrogen/money'

export const showCart = new Store(false)

export function openCartDrawer() {
  showCart.setState(() => true)
}

function LineItem({
  line,
}: {
  line: {
    id: string
    quantity: number
    cost: { totalAmount: { amount: string; currencyCode: string } }
    merchandise?: any
  }
}) {
  const { formProps, register } = useCartForm()
  const pendingLines = useCart((state) => state.pending.lines)
  const pending = pendingLines.has(line.id)
  const merch = line.merchandise
  const image = merch?.image

  return (
    <form
      {...formProps()}
      className="flex gap-3 border-b border-[var(--line)] py-3"
    >
      <button {...register('set')} className="hidden" aria-hidden="true" />
      <input type="hidden" {...register('lineId', { value: line.id })} />
      {image ? (
        <img
          src={image.url}
          alt={image.altText ?? merch?.product?.title ?? ''}
          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--chip-bg)]">
          <ShoppingBag className="h-6 w-6 text-[var(--sea-ink-soft)]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-[var(--sea-ink)]">
            {merch?.product?.title ?? merch?.title ?? 'Product'}
          </p>
          <button
            type="submit"
            {...register('remove')}
            className="demo-muted text-xs hover:text-[var(--sea-ink)]"
          >
            Remove
          </button>
        </div>
        {merch?.selectedOptions?.length ? (
          <p className="demo-muted mt-0.5 text-xs">
            {merch.selectedOptions
              .map((o: any) => `${o.name}: ${o.value}`)
              .join(', ')}
          </p>
        ) : null}
        <div
          className={`mt-2 flex items-center justify-between ${pending ? 'opacity-40' : ''}`}
        >
          <div className="flex items-center gap-1.5">
            <button
              type="submit"
              {...register('decrease')}
              className="demo-button demo-button-secondary h-7 w-7 justify-center p-0 text-sm"
            >
              -
            </button>
            <input
              {...register('quantity', {
                value: line.quantity,
                interactive: true,
              })}
              className="demo-input h-7 w-10 px-0 text-center text-sm"
            />
            <button
              type="submit"
              {...register('increase')}
              className="demo-button demo-button-secondary h-7 w-7 justify-center p-0 text-sm"
            >
              +
            </button>
          </div>
          <span className="text-sm font-semibold text-[var(--sea-ink)]">
            {formatAmount(
              line.cost.totalAmount.amount,
              line.cost.totalAmount.currencyCode,
            )}
          </span>
        </div>
      </div>
    </form>
  )
}

export default function CartDrawer() {
  const isOpen = useStore(showCart, (s) => s)
  const lines = useCart((state) => state.data.lines.nodes)
  const loading = useCart((state) => state.loading)
  const subtotal = useCart((state) => state.data.cost?.subtotalAmount)
  const checkoutUrl = useCart((state) => state.data.checkoutUrl)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => showCart.setState(() => false)}
      />
      <aside className="demo-panel absolute right-0 top-0 flex h-full w-full max-w-md flex-col rounded-none border-l p-0 sm:w-[420px]">
        <div className="flex items-center justify-between border-b border-[var(--line)] p-4">
          <h3 className="flex items-center gap-2 font-semibold text-[var(--sea-ink)]">
            <ShoppingBag className="h-5 w-5" /> Your Cart
          </h3>
          <button
            onClick={() => showCart.setState(() => false)}
            className="demo-muted hover:text-[var(--sea-ink)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <div className="demo-muted py-10 text-center text-sm">
              Loading your cart…
            </div>
          ) : lines.length === 0 ? (
            <div className="demo-muted flex flex-col items-center gap-2 py-16 text-center text-sm">
              <ShoppingBag className="h-8 w-8 opacity-50" />
              Your cart is empty.
            </div>
          ) : (
            lines.map((line: any) => <LineItem key={line.id} line={line} />)
          )}
        </div>

        {lines.length > 0 ? (
          <div className="border-t border-[var(--line)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="demo-muted text-sm">Subtotal</span>
              <span className="text-lg font-bold text-[var(--sea-ink)]">
                {subtotal
                  ? formatAmount(subtotal.amount, subtotal.currencyCode)
                  : '—'}
              </span>
            </div>
            <a
              href={checkoutUrl ?? '#'}
              className="demo-button w-full justify-center py-3 no-underline"
            >
              Checkout
            </a>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
