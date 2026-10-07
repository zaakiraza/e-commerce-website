// catalog.schemas.ts: query validation and documented response shapes for the `catalog` tag.
import { z } from "zod";

export const ProductListQuerySchema = z.object({
  q: z.string().optional(),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

/** ProductSummary as documented: catalog listing item, primaryImage null when the product has no images. */
export interface ProductSummaryResponse {
  id: string;
  name: string;
  price: number;
  primaryImage: string | null;
  inStock: boolean;
}

/** ProductDetail as documented: description, gallery, price and availability. */
export interface ProductDetailResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
}
