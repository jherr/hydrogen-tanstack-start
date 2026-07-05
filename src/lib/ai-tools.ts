import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

// Shared tool definitions (schemas only). Safe to import from both the client
// (AI hook) and the server (chat route). No server-only imports live here.

const aiProductSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  handle: z.string(),
  title: z.string(),
  description: z.string(),
  productType: z.string(),
  tags: z.array(z.string()),
  price: z.string(),
  currencyCode: z.string(),
  image: z.string().nullable(),
  availableForSale: z.boolean(),
})

export const searchProductsToolDef = toolDefinition({
  name: 'searchProducts',
  description:
    'Search the live Shopify store catalog for products matching a query (keywords, product type, or style). Best for finding a SPECIFIC item. Returns real products with prices, descriptions, and the variant id needed to add to cart. For open-ended requests like "make me an outfit" or "what do you sell?", prefer browseCatalog to see the whole inventory first.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Search keywords describing what the customer wants, e.g. "hoodie", "dad cap", "t-shirt", or a Shopify filter like "product_type:Hat".',
      ),
    first: z
      .number()
      .optional()
      .describe('Max number of products to return (default 6).'),
  }),
  outputSchema: z.array(aiProductSchema),
})

export const browseCatalogToolDef = toolDefinition({
  name: 'browseCatalog',
  description:
    'List a broad selection of products across ALL categories/product types in the store (tops, hoodies, hats, accessories, etc.). Use this FIRST for open-ended or styling requests such as "make me an outfit", "what should I buy?", or "show me what you have", so you can pick complementary items from different product types. Returns real products with product type, tags, price, handle, and variant id.',
  inputSchema: z.object({
    first: z
      .number()
      .optional()
      .describe('Max number of products to return across the catalog (default 50).'),
  }),
  outputSchema: z.array(aiProductSchema),
})

const productCardSchema = z
  .object({
    id: z.string(),
    variantId: z.string(),
    handle: z.string(),
    title: z.string(),
    description: z.string(),
    price: z.string(),
    currencyCode: z.string(),
    image: z.string().nullable(),
    imageAlt: z.string().nullable(),
    availableForSale: z.boolean(),
  })
  .nullable()

export const recommendProductToolDef = toolDefinition({
  name: 'recommendProduct',
  description:
    'REQUIRED tool to visually present a product recommendation to the customer. This MUST be used whenever recommending a specific product - do NOT describe products in plain text. It renders an appealing product card with an image, price, an "Add to cart" button, and a link to view details. Pass the product `handle` from searchProducts results.',
  inputSchema: z.object({
    handle: z
      .string()
      .describe('The product handle to recommend (from searchProducts results).'),
  }),
  outputSchema: productCardSchema,
})

export const addToCartToolDef = toolDefinition({
  name: 'addToCart',
  description:
    'Add a product variant to the customer\'s shopping cart. Use the `variantId` from searchProducts (or recommendProduct) as the merchandiseId. Only call this when the customer clearly wants to add an item to their cart.',
  inputSchema: z.object({
    merchandiseId: z
      .string()
      .describe('The product variant id (GID) to add, from searchProducts.variantId.'),
    quantity: z.number().optional().describe('Quantity to add (default 1).'),
    title: z
      .string()
      .optional()
      .describe('The product title, used for the confirmation message.'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
})
