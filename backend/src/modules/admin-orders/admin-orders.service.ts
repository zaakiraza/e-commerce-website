// admin-orders.service.ts: order dashboard for the `admin-orders` tag — every order in full,
// plus the status workflow pending → confirmed → shipped → delivered, with cancellation from
// pending or confirmed (which restores stock).
import { asc, desc, eq, sql } from "drizzle-orm";
import { Inject, Injectable } from "@nestjs/common";
import { type AuthUser } from "../../common/auth";
import { AppError } from "../../common/errors";
import { round2 } from "../../common/money";
import { DB, type Db } from "../../db/db.module";
import { orderLines, orders, products, users } from "../../db/schema";
import type { AdminOrderDetailResponse, AdminOrderSummaryResponse, UpdateOrderStatusInput } from "./admin-orders.schemas";

/** Forward-only single-step moves; cancellation is allowed from pending and confirmed only. */
const ALLOWED_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

@Injectable()
export class AdminOrdersService {
  constructor(@Inject(DB) private readonly db: Db) {}

  listOrders(user: AuthUser): AdminOrderSummaryResponse[] {
    this.requireAdmin(user);
    return this.db
      .select({ order: orders, customer: users })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.placedAt), desc(orders.id))
      .all()
      .map(({ order, customer }) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: customer.fullName,
        placedAt: order.placedAt.toISOString(),
        total: round2(order.total),
        status: order.status,
      }));
  }

  getOrder(user: AuthUser, id: string): AdminOrderDetailResponse {
    this.requireAdmin(user);
    const row = this.requireOrder(id);
    return this.toDetail(row.order, row.customer);
  }

  updateStatus(user: AuthUser, id: string, status: UpdateOrderStatusInput["status"]): { status: string } {
    this.requireAdmin(user);
    const row = this.requireOrder(id);
    if (!ALLOWED_TRANSITIONS[row.order.status]?.includes(status)) {
      throw new AppError("CONFLICT", 409, "This status change is not allowed.");
    }
    this.db.transaction((tx) => {
      if (status === "cancelled") {
        // Cancelling releases the reserved stock back to the products.
        const lines = tx.select().from(orderLines).where(eq(orderLines.orderId, id)).all();
        for (const line of lines) {
          if (line.productId) {
            tx.update(products)
              .set({ stockQuantity: sql`${products.stockQuantity} + ${line.quantity}` })
              .where(eq(products.id, line.productId))
              .run();
          }
        }
      }
      tx.update(orders).set({ status }).where(eq(orders.id, id)).run();
    });
    return { status };
  }

  private requireOrder(id: string): { order: typeof orders.$inferSelect; customer: typeof users.$inferSelect } {
    const row = this.db
      .select({ order: orders, customer: users })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, id))
      .get();
    if (!row) {
      throw new AppError("NOT_FOUND", 404, "Order not found");
    }
    return row;
  }

  /** The contract's Forbidden response for non-admins says "Unauthorized". */
  private requireAdmin(user: AuthUser): void {
    const role = this.db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).get()?.role;
    if (role !== "admin") {
      throw new AppError("FORBIDDEN", 403, "Unauthorized");
    }
  }

  private toDetail(
    order: typeof orders.$inferSelect,
    customer: typeof users.$inferSelect,
  ): AdminOrderDetailResponse {
    const lines = this.db
      .select()
      .from(orderLines)
      .where(eq(orderLines.orderId, order.id))
      .orderBy(asc(orderLines.createdAt), asc(orderLines.id))
      .all()
      .map((line) => ({
        id: line.id,
        productId: line.productId,
        productNameSnapshot: line.productNameSnapshot,
        unitPriceSnapshot: round2(line.unitPriceSnapshot),
        quantity: line.quantity,
        lineTotal: round2(line.lineTotal),
      }));
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      placedAt: order.placedAt.toISOString(),
      status: order.status,
      paymentMethod: order.paymentMethod,
      total: round2(order.total),
      lines,
      deliveryFullName: order.deliveryFullName,
      deliveryPhone: order.deliveryPhone,
      deliveryStreet: order.deliveryStreet,
      deliveryCity: order.deliveryCity,
      deliveryPostalCode: order.deliveryPostalCode,
      customer: { id: customer.id, email: customer.email, fullName: customer.fullName },
    };
  }
}
