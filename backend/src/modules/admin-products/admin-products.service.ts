// admin-products.service.ts: full product CRUD (admin only) for the `admin-products` tag.
// "Delete" deactivates: catalog rows disappear, order snapshots survive untouched.
import { asc, eq } from "drizzle-orm";
import { Inject, Injectable } from "@nestjs/common";
import { type AuthUser } from "../../common/auth";
import { AppError } from "../../common/errors";
import { round2 } from "../../common/money";
import { DB, type Db } from "../../db/db.module";
import { productImages, products, users } from "../../db/schema";
import type { AdminProductResponse, ProductCreateInput, ProductUpdateInput } from "./admin-products.schemas";

@Injectable()
export class AdminProductsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  listProducts(user: AuthUser): AdminProductResponse[] {
    this.requireAdmin(user);
    return this.db
      .select()
      .from(products)
      .orderBy(asc(products.createdAt), asc(products.id))
      .all()
      .map((row) => this.serialize(row, this.imagesOf(row.id)));
  }

  getProduct(user: AuthUser, id: string): AdminProductResponse {
    this.requireAdmin(user);
    const row = this.requireProduct(id);
    return this.serialize(row, this.imagesOf(id));
  }

  createProduct(user: AuthUser, input: ProductCreateInput): AdminProductResponse {
    this.requireAdmin(user);
    const [created] = this.db
      .insert(products)
      .values({
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        stockQuantity: input.stockQuantity,
        isActive: true,
      })
      .returning()
      .all();
    this.db
      .insert(productImages)
      .values(input.images.map((url, index) => ({ productId: created.id, url, sortOrder: index })))
      .run();
    return this.serialize(created, input.images);
  }

  updateProduct(user: AuthUser, id: string, input: ProductUpdateInput): AdminProductResponse {
    this.requireAdmin(user);
    this.requireProduct(id);
    const patch: Partial<typeof products.$inferInsert> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.price !== undefined) patch.price = input.price;
    if (input.stockQuantity !== undefined) patch.stockQuantity = input.stockQuantity;
    const [updated] = this.db.update(products).set(patch).where(eq(products.id, id)).returning().all();
    const images = input.images;
    if (images !== undefined) {
      // The gallery is replaced as a whole, keeping the request order.
      this.db.transaction((tx) => {
        tx.delete(productImages).where(eq(productImages.productId, id)).run();
        tx.insert(productImages)
          .values(images.map((url, index) => ({ productId: id, url, sortOrder: index })))
          .run();
      });
    }
    return this.serialize(updated, this.imagesOf(id));
  }

  deleteProduct(user: AuthUser, id: string): void {
    this.requireAdmin(user);
    this.requireProduct(id);
    this.db.update(products).set({ isActive: false }).where(eq(products.id, id)).run();
  }

  private requireProduct(id: string): typeof products.$inferSelect {
    const row = this.db.select().from(products).where(eq(products.id, id)).get();
    if (!row) {
      throw new AppError("NOT_FOUND", 404, "Product not found");
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

  private imagesOf(productId: string): string[] {
    return this.db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt), asc(productImages.id))
      .all()
      .map((image) => image.url);
  }

  private serialize(row: typeof products.$inferSelect, images: string[]): AdminProductResponse {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: round2(row.price),
      stockQuantity: row.stockQuantity,
      images,
      isActive: row.isActive,
    };
  }
}
