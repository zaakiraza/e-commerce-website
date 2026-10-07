// cart.service.ts: guest and user carts for the `cart` tag. Guests are identified by the
// cart_session cookie (issued on first contact); signed-in callers always use their persisted
// user cart. Merging a guest cart on sign-in happens here too (called by the auth tag).
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { Inject, Injectable } from "@nestjs/common";
import type { Request, Response } from "express";
import { type AuthUser, TokenService } from "../../common/auth";
import { AppError } from "../../common/errors";
import { round2 } from "../../common/money";
import { DB, type Db } from "../../db/db.module";
import { type Cart, cartItems, carts, productImages, products } from "../../db/schema";
import { readCartSession, writeCartSession } from "./cart-session";
import type { AddCartItemInput, CartResponse, UpdateCartItemInput } from "./cart.schemas";

/** Who is calling a cart endpoint: a verified user, or a guest session. */
export interface CartCaller {
  user: AuthUser | null;
  sessionId: string | null;
}

@Injectable()
export class CartService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Optional auth: a valid bearer token means the caller's persisted user cart; otherwise the
   * guest cart keyed by the session cookie, which is issued here when the guest has none yet.
   */
  resolveCaller(request: Request, response: Response): CartCaller {
    const header = request.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
    const user = token ? this.tokens.verify(token) : null;
    if (user) {
      return { user, sessionId: null };
    }
    const existing = readCartSession(request);
    if (existing) {
      return { user: null, sessionId: existing };
    }
    const sessionId = crypto.randomUUID();
    writeCartSession(response, sessionId);
    return { user: null, sessionId };
  }

  getCart(caller: CartCaller): CartResponse {
    return this.serialize(this.ensureCart(caller));
  }

  /** Adds a product, incrementing the existing line instead of duplicating it. */
  addItem(caller: CartCaller, input: AddCartItemInput): CartResponse {
    const cart = this.ensureCart(caller);
    const product = this.db
      .select()
      .from(products)
      .where(and(eq(products.id, input.productId), eq(products.isActive, true)))
      .get();
    if (!product) {
      throw new AppError("NOT_FOUND", 404, "Product not found");
    }
    const existing = this.db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, product.id)))
      .get();
    const desired = (existing?.quantity ?? 0) + input.quantity;
    this.assertQuantity(product.stockQuantity, desired);
    if (existing) {
      this.db.update(cartItems).set({ quantity: desired }).where(eq(cartItems.id, existing.id)).run();
    } else {
      this.db.insert(cartItems).values({ cartId: cart.id, productId: product.id, quantity: input.quantity }).run();
    }
    return this.serialize(cart);
  }

  /** Sets a line's quantity; keeps the previous quantity when stock cannot cover the request. */
  updateItem(caller: CartCaller, itemId: string, input: UpdateCartItemInput): CartResponse {
    const cart = this.ensureCart(caller);
    const line = this.lineOf(cart.id, itemId);
    const product = this.db.select().from(products).where(eq(products.id, line.productId)).get();
    this.assertQuantity(product?.isActive ? product.stockQuantity : 0, input.quantity);
    this.db.update(cartItems).set({ quantity: input.quantity }).where(eq(cartItems.id, line.id)).run();
    return this.serialize(cart);
  }

  removeItem(caller: CartCaller, itemId: string): CartResponse {
    const cart = this.ensureCart(caller);
    this.lineOf(cart.id, itemId); // 404 when the id is not a line of the caller's cart
    this.db.delete(cartItems).where(eq(cartItems.id, itemId)).run();
    return this.serialize(cart);
  }

  /**
   * Sign-in hook: folds the guest cart carried by `sessionId` into the user's cart (summing
   * quantities, capped at stock) and deletes the guest cart. Best-effort by design — login
   * never fails because of stock limits.
   */
  mergeGuestCart(sessionId: string, userId: string): void {
    this.db.transaction((tx) => {
      const guest = tx
        .select()
        .from(carts)
        .where(and(eq(carts.sessionId, sessionId), isNull(carts.userId)))
        .get();
      const guestItems = guest
        ? tx.select().from(cartItems).where(eq(cartItems.cartId, guest.id)).orderBy(asc(cartItems.createdAt)).all()
        : [];
      if (!guest || guestItems.length === 0) {
        return;
      }
      let userCart = tx.select().from(carts).where(eq(carts.userId, userId)).get();
      if (!userCart) {
        [userCart] = tx.insert(carts).values({ sessionId: `user-${userId}`, userId }).returning().all();
      }
      for (const item of guestItems) {
        const product = tx.select().from(products).where(eq(products.id, item.productId)).get();
        if (!product || !product.isActive) {
          continue;
        }
        const existing = tx
          .select()
          .from(cartItems)
          .where(and(eq(cartItems.cartId, userCart.id), eq(cartItems.productId, item.productId)))
          .get();
        const merged = Math.min((existing?.quantity ?? 0) + item.quantity, product.stockQuantity);
        if (merged < 1) {
          continue;
        }
        if (existing) {
          tx.update(cartItems).set({ quantity: merged }).where(eq(cartItems.id, existing.id)).run();
        } else {
          tx.insert(cartItems).values({ cartId: userCart.id, productId: item.productId, quantity: merged }).run();
        }
      }
      tx.delete(carts).where(eq(carts.id, guest.id)).run(); // lines cascade away
    });
  }

  /** 409 when `quantity` cannot be covered by `stock`; the wording follows the contract examples. */
  private assertQuantity(stock: number, quantity: number): void {
    if (stock <= 0) {
      throw new AppError("CONFLICT", 409, "Out of stock");
    }
    if (quantity > stock) {
      throw new AppError("CONFLICT", 409, `Only ${stock} available.`);
    }
  }

  private lineOf(cartId: string, itemId: string) {
    const line = this.db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)))
      .get();
    if (!line) {
      throw new AppError("NOT_FOUND", 404, "Cart item not found");
    }
    return line;
  }

  private ensureCart(caller: CartCaller): Cart {
    if (caller.user) {
      return this.ensureCartFor(caller.user.id);
    }
    const existing = this.db
      .select()
      .from(carts)
      .where(and(eq(carts.sessionId, caller.sessionId ?? ""), isNull(carts.userId)))
      .get();
    if (existing) {
      return existing;
    }
    const [created] = this.db
      .insert(carts)
      .values({ sessionId: caller.sessionId ?? crypto.randomUUID() })
      .returning()
      .all();
    return created;
  }

  private ensureCartFor(userId: string): Cart {
    const existing = this.db.select().from(carts).where(eq(carts.userId, userId)).get();
    if (existing) {
      return existing;
    }
    const [created] = this.db.insert(carts).values({ sessionId: `user-${userId}`, userId }).returning().all();
    return created;
  }

  private serialize(cart: Cart): CartResponse {
    const rows = this.db
      .select({ item: cartItems, product: products })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id))
      .orderBy(asc(cartItems.createdAt), asc(cartItems.id))
      .all();
    const primary = this.primaryImages(rows.map((row) => row.product.id));
    const items = rows.map(({ item, product }) => ({
      id: item.id,
      product: {
        id: product.id,
        name: product.name,
        price: round2(product.price),
        primaryImage: primary.get(product.id) ?? null,
        inStock: product.stockQuantity > 0,
      },
      quantity: item.quantity,
      lineTotal: round2(product.price * item.quantity),
    }));
    return {
      id: cart.id,
      items,
      total: round2(items.reduce((sum, item) => sum + item.lineTotal, 0)),
    };
  }

  private primaryImages(ids: string[]): Map<string, string> {
    if (ids.length === 0) {
      return new Map();
    }
    const rows = this.db
      .select({ productId: productImages.productId, url: productImages.url })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt), asc(productImages.id))
      .all();
    const primary = new Map<string, string>();
    for (const row of rows) {
      if (!primary.has(row.productId)) {
        primary.set(row.productId, row.url);
      }
    }
    return primary;
  }
}
