// cart.schemas.ts: body validation and documented response shapes for the `cart` tag.
import { z } from "zod";
import type { ProductSummaryResponse } from "../catalog/catalog.schemas";

export const AddCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
});
export type AddCartItemInput = z.infer<typeof AddCartItemSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;

/** CartItem as documented: the line plus a ProductSummary of its product. */
export interface CartItemResponse {
  id: string;
  product: ProductSummaryResponse;
  quantity: number;
  lineTotal: number;
}

/** Cart as documented: lines with per-line totals and the cart total. */
export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  total: number;
}
