import { formatMoney } from '@shopify/hydrogen'
import type { MoneyV2 } from '@shopify/hydrogen'

const LOCALE = 'en-US'

export function formatPrice(money: MoneyV2, locale = LOCALE): string {
  return formatMoney(money, { locale }).toString()
}

export function formatPriceRange(
  min: MoneyV2,
  max?: MoneyV2,
  locale = LOCALE,
): string {
  if (!max || (min.amount === max.amount && min.currencyCode === max.currencyCode))
    return formatPrice(min, locale)
  return formatMoney([min, max], { locale, withoutTrailingZeros: true }).toString()
}

// Format a raw amount + currency (used for AI tool card data).
export function formatAmount(
  amount: string,
  currencyCode: string,
  locale = LOCALE,
): string {
  return formatMoney({ amount, currencyCode }, { locale }).toString()
}
