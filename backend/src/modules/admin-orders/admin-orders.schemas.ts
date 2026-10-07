// admin-orders.schemas.ts: body validation and documented response shapes for the `admin-orders` tag.
import { z } from "zod";
import type { OrderDetailResponse, OrderStatusValue } from "../orders/orders.schemas";

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(["confirmed", "shipped", "delivered", "cancelled"]),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

/** AdminOrderSummary as documented: one dashboard row with the customer's name. */
export interface AdminOrderSummaryResponse {
  id: string;
  orderNumber: string;
  customerName: string;
  placedAt: string;
  total: number;
  status: OrderStatusValue;
}

/** AdminOrderDetail as documented: OrderDetail plus the customer block. */
export interface AdminOrderDetailResponse extends OrderDetailResponse {
  customer: { id: string; email: string; fullName: string };
}
