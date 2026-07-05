import { createFileRoute, Link } from '@tanstack/react-router'
import { ShoppingBag } from 'lucide-react'

import { useCart, useCartForm } from '#/lib/hydrogen/cart'
import { formatAmount } from '#/lib/hydrogen/money'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartLine({
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

  return (
    <form
      {...formProps()}
      className="flex items-center gap-4 border-b border-[var(--line)] py-4"
    >
      {merch?.image ? (
        <img
          src={merch.image.url}
          alt={merch.image.altText ?? ''}
          className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--chip-bg)]">
          <ShoppingBag className="h-6 w-6 text-[var(--sea-ink-soft)]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--sea-ink)]">
          {merch?.product?.title ?? merch?.title ?? 'Product'}
        </p>
        {merch?.selectedOptions?.length ? (
          <p className="demo-muted mt-0.5 text-xs">
            {merch.selectedOptions
              .map((o: any) => `${o.name}: ${o.value}`)
              .join(', ')}
          </p>
        ) : null}
        <button {...register('set')} className="hidden" />
        <input type="hidden" {...register('lineId', { value: line.id })} />
        <div
          className={`mt-2 flex items-center gap-1.5 ${pending ? 'opacity-40' : ''}`}
        >
          <button
            type="submit"
            {...register('decrease')}
            className="demo-button demo-button-secondary h-8 w-8 justify-center p-0"
          >
            -
          </button>
          <input
            {...register('quantity', { value: line.quantity, interactive: true })}
            className="demo-input h-8 w-12 px-0 text-center text-sm"
          />
          <button
            type="submit"
            {...register('increase')}
            className="demo-button demo-button-secondary h-8 w-8 justify-center p-0"
          >
            +
          </button>
          <button
            type="submit"
            {...register('remove')}
            className="demo-muted ml-3 text-xs hover:text-[var(--sea-ink)]"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="text-sm font-semibold text-[var(--sea-ink)]">
        {formatAmount(
          line.cost.totalAmount.amount,
          line.cost.totalAmount.currencyCode,
        )}
      </div>
    </form>
  )
}

function CartPage() {
  const lines = useCart((state) => state.data.lines.nodes)
  const loading = useCart((state) => state.loading)
  const subtotal = useCart((state) => state.data.cost?.subtotalAmount)
  const checkoutUrl = useCart((state) => state.data.checkoutUrl)

  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      <h1 className="display-title mb-6 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
        Your Cart
      </h1>

      {loading ? (
        <p className="demo-muted text-sm">Loading your cart…</p>
      ) : lines.length === 0 ? (
        <div className="demo-card flex flex-col items-center gap-3 py-16 text-center">
          <ShoppingBag className="h-10 w-10 opacity-40" />
          <p className="demo-muted text-sm">Your cart is empty.</p>
          <Link to="/" className="demo-button px-5 py-2.5 no-underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="demo-card p-4">
            {lines.map((line: any) => (
              <CartLine key={line.id} line={line} />
            ))}
          </div>
          <aside className="demo-card h-fit p-5">
            <div className="mb-4 flex items-center justify-between">
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
          </aside>
        </div>
      )}
    </main>
  )
}
