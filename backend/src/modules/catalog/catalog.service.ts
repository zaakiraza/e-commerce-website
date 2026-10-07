// catalog.service.ts: public storefront browsing for the `catalog` tag.
import { and, asc, eq, inArray, like, sql } from "drizzle-orm";
import { Inject, Injectable } from "@nestjs/common";
import { round2 } from "../../common/money";
import { AppError } from "../../common/errors";
import { DB, type Db } from "../../db/db.module";
import { productImages, products } from "../../db/schema";
import type { ProductDetailResponse, ProductSummaryResponse } from "./catalog.schemas";

@Injectable()
export class CatalogService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Active products only; `q` is a case-insensitive substring match on the product name. */
  listProducts(q?: string): ProductSummaryResponse[] {
    const filters = [eq(products.isActive, true)];
    const term = q?.trim();
    if (term) {
      filters.push(like(sql`lower(${products.name})`, `%${term.toLowerCase()}%`));
    }
    const rows = this.db
      .select()
      .from(products)
      .where(and(...filters))
      .orderBy(asc(products.createdAt), asc(products.id))
      .all();
    if (rows.length === 0) {
      return [];
    }
    const primary = this.primaryImages(rows.map((row) => row.id));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: round2(row.price),
      primaryImage: primary.get(row.id) ?? null,
      inStock: row.stockQuantity > 0,
    }));
  }

  /** Full public detail; inactive or unknown products are "not found" to storefront visitors. */
  getProduct(id: string): ProductDetailResponse {
    const row = this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.isActive, true)))
      .get();
    if (!row) {
      throw new AppError("NOT_FOUND", 404, "Product not found");
    }
    const images = this.db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sortOrder), asc(productImages.createdAt), asc(productImages.id))
      .all()
      .map((image) => image.url);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: round2(row.price),
      images,
      inStock: row.stockQuantity > 0,
      stockQuantity: row.stockQuantity,
    };
  }

  /** First image URL per product (by sortOrder), used as the catalog thumbnail. */
  private primaryImages(ids: string[]): Map<string, string> {
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
