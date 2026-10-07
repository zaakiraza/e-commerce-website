// orders.schemas.ts: body validation and documented response shapes for the `orders` tag.
import { z } from "zod";

export const CreateOrderSchema = z.object({
  deliveryFullName: z.string().trim().min(1),
  deliveryPhone: z.string().trim().min(1),
  deliveryStreet: z.string().trim().min(1),
  deliveryCity: z.string().trim().min(1),
  deliveryPostalCode: z.string().trim().min(1),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export type OrderStatusValue = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

/** OrderCreated as documented: the confirmation the storefront shows after checkout. */
export interface OrderCreatedResponse {
  id: string;
  orderNumber: string;
  status: "pending";
}

/** OrderSummary as documented: one row on the customer's orders page. */
export interface OrderSummaryResponse {
  id: string;
  orderNumber: string;
  placedAt: string;
  total: number;
  status: OrderStatusValue;
}

/** OrderLine as documented: snapshotted, survives product edits and deletion. */
export interface OrderLineResponse {
  id: string;
  productId: string | null;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
}

/** OrderDetail as documented: lines, delivery info and totals. */
export interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  placedAt: string;
  status: OrderStatusValue;
  paymentMethod: "cash_on_delivery";
  total: number;
  lines: OrderLineResponse[];
  deliveryFullName: string;
  deliveryPhone: string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryPostalCode: string;
}
