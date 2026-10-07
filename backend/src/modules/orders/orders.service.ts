// orders.service.ts: COD checkout and the customer's own order history for the `orders` tag.
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Inject, Injectable } from "@nestjs/common";
import { type AuthUser } from "../../common/auth";
import { AppError } from "../../common/errors";
import { round2 } from "../../common/money";
import { DB, type Db } from "../../db/db.module";
import { cartItems, carts, orderLines, orders, products, users } from "../../db/schema";
import type { CreateOrderInput, OrderCreatedResponse, OrderDetailResponse, OrderSummaryResponse } from "./orders.schemas";

@Injectable()
export class OrdersService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * Places a COD order from the caller's cart: snapshots names and prices, decrements stock
   * and clears the cart. Stock is re-checked inside the transaction; any shortfall rejects
   * the whole order (409) and preserves the cart. Admins cannot place storefront orders.
   */
  createOrder(user: AuthUser, input: CreateOrderInput): OrderCreatedResponse {
    const role = this.roleOf(user.id);
    if (role === "admin") {
      throw new AppError("FORBIDDEN", 403, "Admins may not place storefront orders");
    }
    const cart = this.db.select().from(carts).where(eq(carts.userId, user.id)).get();
    const lines = cart
      ? this.db
          .select({ item: cartItems, product: products })
          .from(cartItems)
          .innerJoin(products, eq(cartItems.productId, products.id))
          .where(eq(cartItems.cartId, cart.id))
          .all()
      : [];
    if (!cart || lines.length === 0) {
      throw new AppError("VALIDATION_ERROR", 400, "Your cart is empty");
    }

    const orderId = crypto.randomUUID();
    const orderNumber = this.nextOrderNumber();
    this.db.transaction((tx) => {
      const priced = lines.map(({ item, product }) => {
        const available = product.isActive ? product.stockQuantity : 0;
        if (item.quantity > available) {
          throw new AppError("CONFLICT", 409, `Only ${available} available for ${product.name}. Please adjust your cart.`);
        }
        return { item, product, lineTotal: round2(product.price * item.quantity) };
      });
      const total = round2(priced.reduce((sum, line) => sum + line.lineTotal, 0));
      tx.insert(orders)
        .values({
          id: orderId,
          orderNumber,
          userId: user.id,
          status: "pending",
          paymentMethod: "cash_on_delivery",
          deliveryFullName: input.deliveryFullName,
          deliveryPhone: input.deliveryPhone,
          deliveryStreet: input.deliveryStreet,
          deliveryCity: input.deliveryCity,
          deliveryPostalCode: input.deliveryPostalCode,
          total,
        })
        .run();
      tx.insert(orderLines)
        .values(
          priced.map(({ item, product, lineTotal }) => ({
            orderId,
            productId: product.id,
            productNameSnapshot: product.name,
            unitPriceSnapshot: round2(product.price),
            quantity: item.quantity,
            lineTotal,
          })),
        )
        .run();
      for (const { item, product } of priced) {
        tx.update(products)
          .set({ stockQuantity: product.stockQuantity - item.quantity })
          .where(eq(products.id, product.id))
          .run();
      }
      tx.delete(cartItems).where(eq(cartItems.cartId, cart.id)).run();
    });
    return { id: orderId, orderNumber, status: "pending" };
  }

  listMine(user: AuthUser): OrderSummaryResponse[] {
    return this.db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.placedAt), desc(orders.id))
      .all()
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        placedAt: order.placedAt.toISOString(),
        total: round2(order.total),
        status: order.status,
      }));
  }

  /** Other customers' orders are "not found", without revealing that they exist. */
  getMine(user: AuthUser, id: string): OrderDetailResponse {
    const order = this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.userId, user.id)))
      .get();
    if (!order) {
      throw new AppError("NOT_FOUND", 404, "Order not found");
    }
    return this.toDetail(order);
  }

  /** ORD-1001, ORD-1002, ... skipping any number that already exists. */
  private nextOrderNumber(): string {
    const count = Number(this.db.select({ value: sql<number>`count(*)` }).from(orders).get()?.value ?? 0);
    let number = 1001 + count;
    while (this.db.select({ id: orders.id }).from(orders).where(eq(orders.orderNumber, `ORD-${number}`)).get()) {
      number += 1;
    }
    return `ORD-${number}`;
  }

  private toDetail(order: typeof orders.$inferSelect): OrderDetailResponse {
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
    };
  }

  private roleOf(userId: string): "user" | "admin" | undefined {
    return this.db.select({ role: users.role }).from(users).where(eq(users.id, userId)).get()?.role;
  }
}
