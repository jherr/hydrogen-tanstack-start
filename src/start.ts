import { createStart } from '@tanstack/react-start'
import { shopifyGate } from './lib/hydrogen/gate'

export const startInstance = createStart(() => ({
  requestMiddleware: [shopifyGate],
}))
