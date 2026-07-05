import { createCartServerHandlers } from '@shopify/hydrogen'

// Credential-free to construct; only calls the SFAPI when invoked. Exported so
// the React bindings can derive the cart type from `typeof cartHandlers`.
export const cartHandlers = createCartServerHandlers()
