// admin-orders.controller.ts: thin; one handler per admin-orders operationId, named exactly like it.
import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { type AuthUser, CurrentUser, JwtAuthGuard } from "../../common/auth";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { UpdateOrderStatusSchema, type AdminOrderDetailResponse, type AdminOrderSummaryResponse, type UpdateOrderStatusInput } from "./admin-orders.schemas";
import { AdminOrdersService } from "./admin-orders.service";

@Controller("admin/orders")
@UseGuards(JwtAuthGuard)
export class AdminOrdersController {
  constructor(private readonly service: AdminOrdersService) {}

  @Get()
  admin_orders_list(@CurrentUser() user: AuthUser): AdminOrderSummaryResponse[] {
    return this.service.listOrders(user);
  }

  @Get(":id")
  admin_orders_get(@CurrentUser() user: AuthUser, @Param("id") id: string): AdminOrderDetailResponse {
    return this.service.getOrder(user, id);
  }

  @Patch(":id/status")
  admin_orders_update_status(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema)) body: UpdateOrderStatusInput,
  ): { status: string } {
    return this.service.updateStatus(user, id, body.status);
  }
}
