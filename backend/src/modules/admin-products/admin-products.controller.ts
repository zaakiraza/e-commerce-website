// admin-products.controller.ts: thin; one handler per admin-products operationId, named exactly like it.
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { type AuthUser, CurrentUser, JwtAuthGuard } from "../../common/auth";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { ProductCreateSchema, ProductUpdateSchema, type AdminProductResponse, type ProductCreateInput, type ProductUpdateInput } from "./admin-products.schemas";
import { AdminProductsService } from "./admin-products.service";

@Controller("admin/products")
@UseGuards(JwtAuthGuard)
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}

  @Get()
  admin_products_list(@CurrentUser() user: AuthUser): AdminProductResponse[] {
    return this.service.listProducts(user);
  }

  @Post()
  @HttpCode(201)
  admin_products_create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ProductCreateSchema)) body: ProductCreateInput,
  ): AdminProductResponse {
    return this.service.createProduct(user, body);
  }

  @Get(":id")
  admin_products_get(@CurrentUser() user: AuthUser, @Param("id") id: string): AdminProductResponse {
    return this.service.getProduct(user, id);
  }

  @Patch(":id")
  admin_products_update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ProductUpdateSchema)) body: ProductUpdateInput,
  ): AdminProductResponse {
    return this.service.updateProduct(user, id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  admin_products_delete(@CurrentUser() user: AuthUser, @Param("id") id: string): void {
    this.service.deleteProduct(user, id);
  }
}
