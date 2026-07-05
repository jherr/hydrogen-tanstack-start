import { ShoppingBag } from 'lucide-react'

import { useCart } from '#/lib/hydrogen/cart'
import { showCart } from './CartDrawer'

export default function CartButton() {
  const totalQuantity = useCart((state) => state.data.totalQuantity)

  return (
    <button
      onClick={() => showCart.setState(() => true)}
      className="relative rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
      aria-label="Open cart"
    >
      <ShoppingBag className="h-6 w-6" />
      {totalQuantity > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--lagoon-deep)] px-1 text-[10px] font-bold text-white">
          {totalQuantity}
        </span>
      ) : null}
    </button>
  )
}
