// orders.controller.ts: thin; one handler per orders operationId, named exactly like it.
import { Body, Controller, Get, Param, Post, UseGuards, HttpCode } from "@nestjs/common";
import { type AuthUser, CurrentUser, JwtAuthGuard } from "../../common/auth";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CreateOrderSchema, type CreateOrderInput, type OrderCreatedResponse, type OrderDetailResponse, type OrderSummaryResponse } from "./orders.schemas";
import { OrdersService } from "./orders.service";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  @HttpCode(201)
  orders_create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateOrderSchema)) body: CreateOrderInput,
  ): OrderCreatedResponse {
    return this.service.createOrder(user, body);
  }

  @Get()
  orders_list_mine(@CurrentUser() user: AuthUser): OrderSummaryResponse[] {
    return this.service.listMine(user);
  }

  @Get(":id")
  orders_get_mine(@CurrentUser() user: AuthUser, @Param("id") id: string): OrderDetailResponse {
    return this.service.getMine(user, id);
  }
}
