// admin-products.schemas.ts: body validation and the AdminProduct response for the `admin-products` tag.
// Field messages follow the contract ("Name is required.", "Price must be greater than 0.",
// "Stock cannot be negative.").
import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Name is required.");
const priceSchema = z.number().positive("Price must be greater than 0.");
const stockSchema = z.number().int("Stock cannot be negative.").min(0, "Stock cannot be negative.");
const imagesSchema = z.array(z.string().trim().min(1)).min(1);

export const ProductCreateSchema = z.object({
  name: nameSchema,
  description: z.string().optional(),
  price: priceSchema,
  stockQuantity: stockSchema,
  images: imagesSchema,
});
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;

/** Partial update: any subset of editable fields, at least one (contract `minProperties: 1`). */
export const ProductUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    description: z.string().optional(),
    price: priceSchema.optional(),
    stockQuantity: stockSchema.optional(),
    images: imagesSchema.optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one field is required.",
  });
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;

/** AdminProduct as documented: stock and availability included. */
export interface AdminProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  images: string[];
  isActive: boolean;
}
