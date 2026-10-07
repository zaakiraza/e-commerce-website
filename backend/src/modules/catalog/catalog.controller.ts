// catalog.controller.ts: thin; one handler per catalog operationId, named exactly like it.
import { Controller, Get, Param, Query } from "@nestjs/common";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { ProductListQuerySchema, type ProductDetailResponse, type ProductListQuery, type ProductSummaryResponse } from "./catalog.schemas";
import { CatalogService } from "./catalog.service";

@Controller("products")
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get()
  products_list(
    @Query(new ZodValidationPipe(ProductListQuerySchema)) query: ProductListQuery,
  ): ProductSummaryResponse[] {
    return this.service.listProducts(query.q);
  }

  @Get(":id")
  products_get(@Param("id") id: string): ProductDetailResponse {
    return this.service.getProduct(id);
  }
}
